import { getDb } from './db.js';
import axios from 'axios';

const ML_URL = 'http://localhost:5001';

export async function processAutoClaim(user, trigger, io) {
  const db = getDb();

  // 1. Get active policy
  const policy = db.prepare(`
    SELECT * FROM policies WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1
  `).get(user.id);

  if (!policy) return null;

  // 2. Validate Mock GPS & Duty Status
  if (!user.is_working) {
    console.log(`[Claims] User ${user.id} is off-duty. Ignoring trigger.`);
    return null;
  }
  
  if (user.current_location !== trigger.zone) {
    console.log(`[Claims] User ${user.id} is active in ${user.current_location}, not ${trigger.zone}. Ignoring trigger.`);
    return null;
  }

  // 3. Duplicate prevention — no existing claim for this trigger
  const existingClaim = db.prepare(`
    SELECT id FROM claims WHERE trigger_id = ? AND user_id = ?
  `).get(trigger.id, user.id);

  if (existingClaim) return null;

  // 4. Validate signals
  const platformActive = true; 
  const locationValid = true;  
  
  // 5. Calculate payout & dynamic disruption hours
  const dailyHours = (user.working_hours_end || 21) - (user.working_hours_start || 9);
  const workDays = user.work_days || 6;
  const expectedHourly = (user.weekly_income || 12000) / (workDays * dailyHours);
  
  let disruptionHours = 1; // Default
  if (trigger.type === 'rain') disruptionHours = trigger.severity === 'critical' ? 2 : 1;
  else if (trigger.type === 'flood') disruptionHours = 6;
  else if (trigger.type === 'heat') disruptionHours = 3;
  else if (trigger.type === 'aqi') disruptionHours = 2;
  else if (trigger.type === 'demand') disruptionHours = 1.5;
  else if (trigger.type === 'traffic') disruptionHours = 0.5;

  const expectedInWindow = expectedHourly * disruptionHours;
  
  // Mock actual earnings — reduced based on trigger severity
  const severityFactor = trigger.severity === 'critical' ? 0.2 : trigger.severity === 'high' ? 0.4 : 0.6;
  const actualInWindow = Math.round(expectedInWindow * severityFactor);
  
  let payoutAmount = Math.round(expectedInWindow - actualInWindow);
  const maxSingleClaim = policy.coverage_amount * 0.4; // Max 40% of weekly coverage per claim
  payoutAmount = Math.max(0, Math.min(payoutAmount, maxSingleClaim));

  // 5. Fraud check
  let fraudScore = 0.08; // Default low fraud score
  let fraudRecommendation = 'auto_approve';
  
  try {
    const fraudResponse = await axios.post(`${ML_URL}/fraud-score`, {
      user_id: user.id,
      trigger_type: trigger.type,
      trigger_zone: trigger.zone,
      payout_amount: payoutAmount,
      platform_active: platformActive,
      location_valid: locationValid,
      claim_count_recent: 0,
      hours_since_last_claim: 72,
      trust_score: user.trust_score || 1.0,
    }, { timeout: 2000 });
    
    fraudScore = fraudResponse.data.fraud_score;
    fraudRecommendation = fraudResponse.data.recommendation;
  } catch {
    // ML service down — use conservative default
    fraudScore = 0.1;
    fraudRecommendation = 'auto_approve';
  }

  // 6. Determine claim status based on fraud score
  let claimStatus;
  if (fraudScore < 0.3) claimStatus = 'auto_approved';
  else if (fraudScore < 0.6) claimStatus = 'under_review';
  else claimStatus = 'escalated';

  // 7. Create claim record
  const signalSummary = {
    trigger_type: trigger.type,
    trigger_zone: trigger.zone,
    raw_value: trigger.raw_value,
    threshold: trigger.threshold,
    severity: trigger.severity,
    platform_active: platformActive,
    location_valid: locationValid,
    expected_income: expectedInWindow,
    actual_income: actualInWindow,
    disruption_hours: disruptionHours,
    fraud_score: fraudScore,
    fraud_recommendation: fraudRecommendation,
  };

  const result = db.prepare(`
    INSERT INTO claims (user_id, policy_id, trigger_id, status, expected_income, actual_income, payout_amount, fraud_score, location_valid, platform_active, signal_summary)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    user.id, policy.id, trigger.id, claimStatus,
    expectedInWindow, actualInWindow, payoutAmount,
    fraudScore, locationValid ? 1 : 0, platformActive ? 1 : 0,
    JSON.stringify(signalSummary)
  );

  const claim = {
    id: result.lastInsertRowid,
    user_id: user.id,
    trigger_id: trigger.id,
    status: claimStatus,
    expected_income: expectedInWindow,
    actual_income: actualInWindow,
    payout_amount: payoutAmount,
    fraud_score: fraudScore,
    trigger_type: trigger.type,
    trigger_zone: trigger.zone,
    signal_summary: signalSummary,
  };

  // 8. Emit socket events
  io?.to(`user_${user.id}`).emit('claim:created', claim);

  if (claimStatus === 'auto_approved') {
    // Auto-approve + payout after 2s delay
    setTimeout(() => {
      db.prepare(`UPDATE claims SET status = 'paid', resolved_at = datetime('now') WHERE id = ?`).run(claim.id);
      claim.status = 'paid';
      io?.to(`user_${user.id}`).emit('claim:approved', claim);
    }, 2000);
  } else if (claimStatus === 'under_review') {
    io?.to(`user_${user.id}`).emit('claim:review', claim);
  }

  return claim;
}
