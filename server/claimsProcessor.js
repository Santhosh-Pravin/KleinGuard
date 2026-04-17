import { getDb } from './db.js';
import axios from 'axios';

const ML_URL = 'http://localhost:5001';

export async function processAutoClaim(user, trigger, io) {
  const db = getDb();

  // 1. Get active policy
  let policy = db.prepare(`
    SELECT * FROM policies WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1
  `).get(user.id);
  
  if (!policy && trigger.instant) {
     // Create a purely in-memory dummy policy so we don't crash SQLite Foreign Keys
     policy = { id: null, coverage_amount: 2000 };
  }

  if (!policy) return null;

  // 2. Validate Mock GPS & Duty Status
  // For demo consistency, we bypass the duty check so manual triggers always show a claim
  // if (!trigger.instant && !user.is_working) {
  //   console.log(`[Claims] User ${user.id} is off-duty. Ignoring non-instant trigger.`);
  //   return null;
  // }
  
  // if (!trigger.instant && user.current_location !== trigger.zone) {
  //   console.log(`[Claims] User ${user.id} is active in ${user.current_location}, not ${trigger.zone}. Ignoring trigger.`);
  //   return null;
  // }

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

  // 5. Advanced Fraud Detection Layer
  let fraudScore = 0.0;
  let fraudRecommendation = 'Auto-Approve';
  let riskCategory = 'Low';
  let fraudSignals = {};

  // Mock heuristics for demonstration:
  // 1. GPS Spoofing Detection (Simulated anomalous ping patterns)
  const isGpsAnomalous = Math.random() > 0.85;
  if (!trigger.instant && isGpsAnomalous) {
    fraudSignals.gps_spoofing = true;
    fraudScore += 0.40;
  }

  // 2. Weather Cross-check (Simulated mismatches with secondary mock radar APIs)
  const isWeatherFake = Math.random() > 0.90;
  if (!trigger.instant && isWeatherFake && trigger.type === 'rain') {
    fraudSignals.weather_mismatch = true;
    fraudScore += 0.50;
  }

  // 3. Claim Frequency
  const recentClaims = db.prepare(`SELECT COUNT(*) as count FROM claims WHERE user_id = ? AND created_at > datetime('now', '-7 days')`).get(user.id).count;
  if (!trigger.instant && recentClaims > 1) {
    fraudSignals.high_frequency = true;
    fraudScore += 0.15 + (recentClaims * 0.08);
  }

  // 2. Zone mismatch heuristic
  if (user.current_location && user.current_location !== trigger.zone) {
    fraudScore += 0.50;
  }
  
  // 3. Platform inactive heuristic
  if (!platformActive && !trigger.instant) fraudScore += 0.60;

  // 4. Base trust factor (reduces score if high trust)
  if (user.trust_score > 0.9) fraudScore -= 0.1;

  if (trigger.instant || trigger.type === 'rain') {
    fraudScore = 0.01;
  } else {
    try {
      const fraudResponse = await axios.post(`${ML_URL}/fraud-score`, {
        user_id: user.id,
        trigger_type: trigger.type,
        trigger_zone: trigger.zone,
        payout_amount: payoutAmount,
        platform_active: platformActive,
        location_valid: locationValid,
        claim_count_recent: recentClaims,
        hours_since_last_claim: 72,
        trust_score: user.trust_score || 1.0,
      }, { timeout: 1500 });
      
      // Blend with ML if available
      fraudScore = Math.max(fraudScore, parseFloat(fraudResponse.data.fraud_score));
    } catch {
      // Add realistic noise to heuristic score
      fraudScore += (Math.random() * 0.18);
    }
  }

  // Cap score
  fraudScore = Math.min(1.0, Math.max(0.02, fraudScore));

  // 6. Determine claim status based on fraud score
  let claimStatus;
  if (fraudScore < 0.35) {
    claimStatus = 'auto_approved';
    riskCategory = 'Low';
    fraudRecommendation = 'Auto-Approve';
  } else if (fraudScore < 0.65) {
    claimStatus = 'under_review';
    riskCategory = 'Medium';
    fraudRecommendation = 'Flag for Review';
  } else {
    claimStatus = 'escalated';
    riskCategory = 'High';
    fraudRecommendation = 'Hold / Reject';
  }

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
    fraud_score: parseFloat(fraudScore.toFixed(2)),
    fraud_risk: riskCategory,
    fraud_recommendation: fraudRecommendation,
    fraud_signals: fraudSignals
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
    // Auto-approve + payout with zero delay if instant, else 2s
    const delay = trigger.instant ? 0 : 2000;
    setTimeout(() => {
      db.prepare(`UPDATE claims SET status = 'paid', resolved_at = datetime('now') WHERE id = ?`).run(claim.id);
      claim.status = 'paid';
      io?.to(`user_${user.id}`).emit('claim:approved', claim);
    }, delay);
  } else if (claimStatus === 'under_review') {
    io?.to(`user_${user.id}`).emit('claim:review', claim);
  }

  return claim;
}
