import { Router } from 'express';
import { getDb } from '../db.js';
import { authMiddleware } from './auth.js';
import axios from 'axios';

const router = Router();
const ML_URL = 'http://localhost:5001';

function generatePolicyRef(city) {
  const cityCode = (city || 'CHN').substring(0, 3).toUpperCase();
  const year = new Date().getFullYear();
  const num = String(Math.floor(Math.random() * 999999)).padStart(6, '0');
  return `KG-${cityCode}-${year}-${num}`;
}

// Fallback premium calculation if ML service is down
function calculatePremiumFallback(data) {
  const ZONE_FLOOD_PROB = {
    'Adyar': 0.72, 'Velachery': 0.68, 'T. Nagar': 0.45,
    'Anna Nagar': 0.38, 'Tambaram': 0.81, 'Perambur': 0.52,
    'Royapettah': 0.42, 'Nungambakkam': 0.35, 'Mylapore': 0.55, 'Kodambakkam': 0.40,
  };

  const zones = data.zones || ['Adyar'];
  const avgFloodProb = zones.reduce((sum, z) => sum + (ZONE_FLOOD_PROB[z] || 0.5), 0) / zones.length;
  
  const base_rate = 45;
  const zone_risk = 0.5 + avgFloodProb * 0.5;
  const aqi_exposure = 0.7 + ((data.aqi_avg || 150) / 1000);
  const demand_volatility = 0.6 + ((data.demand_drop_events || 1) * 0.07);
  const behavior_score = (data.trust_score || 1.0) * 0.95;
  const claim_history = 1.0 + ((data.claim_count_4w || 0) * 0.08);
  const safety_compliance = 0.98;

  const coverage = data.coverage_amount || 2000;
  const coverageFactor = coverage / 2000;
  const premium = Math.round(base_rate * zone_risk * aqi_exposure * demand_volatility * behavior_score * claim_history * coverageFactor);
  const risk_score = Math.round((zone_risk * 0.4 + aqi_exposure * 0.2 + demand_volatility * 0.2 + (1 - behavior_score) * 0.2) * 100) / 100;

  let risk_tier = 'low';
  if (risk_score > 0.7) risk_tier = 'high';
  else if (risk_score > 0.4) risk_tier = 'medium';

  return {
    weekly_premium: premium,
    coverage_amount: coverage,
    factors: {
      base_rate,
      zone_risk: Math.round(zone_risk * 100) / 100,
      aqi_exposure: Math.round(aqi_exposure * 100) / 100,
      demand_volatility: Math.round(demand_volatility * 100) / 100,
      behavior_score: Math.round(behavior_score * 100) / 100,
      claim_history: Math.round(claim_history * 100) / 100,
      safety_compliance,
    },
    risk_score,
    formula_display: `₹${base_rate} × ${Math.round(zone_risk * 100) / 100} × ${Math.round(aqi_exposure * 100) / 100} × ${Math.round(demand_volatility * 100) / 100} × ${Math.round(behavior_score * 100) / 100} × ${Math.round(claim_history * 100) / 100} = ₹${premium}/wk`,
    risk_tier,
    recommendation: zone_risk > 0.7
      ? `Zone risk is elevated due to historical waterlogging in ${zones[0]} during monsoon.`
      : `Your zones have moderate risk profiles. Good behavioral score helps keep premium low.`,
  };
}

// POST /api/policy/generate
router.post('/generate', authMiddleware, async (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const zones = JSON.parse(user.zones || '["Adyar"]');
  const coverageAmount = req.body.coverage_amount || 2000;

  // Count recent claims
  const claimStats = db.prepare(`
    SELECT COUNT(*) as count FROM claims WHERE user_id = ? AND created_at > datetime('now', '-28 days')
  `).get(req.userId);

  const payload = {
    user_id: req.userId,
    zones,
    city: user.city || 'Chennai',
    coverage_amount: coverageAmount,
    hours_worked: (user.working_hours_end - user.working_hours_start) * (user.work_days || 6),
    claim_count_4w: claimStats?.count || 0,
    aqi_avg: 150,
    rainfall_days_4w: 3,
    demand_drop_events: 1,
    trust_score: user.trust_score || 1.0,
  };

  let premiumData;
  try {
    const mlResponse = await axios.post(`${ML_URL}/calculate-premium`, payload, { timeout: 3000 });
    premiumData = mlResponse.data;
  } catch {
    console.log('[Policy] ML service unavailable, using fallback calculator');
    premiumData = calculatePremiumFallback(payload);
  }

  res.json(premiumData);
});

// POST /api/policy/activate
router.post('/activate', authMiddleware, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  const { coverage_amount, weekly_premium, factors, risk_score } = req.body;

  // Deactivate any existing policies
  db.prepare(`UPDATE policies SET status = 'expired' WHERE user_id = ? AND status = 'active'`).run(req.userId);

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const policyRef = generatePolicyRef(user?.city);

  const result = db.prepare(`
    INSERT INTO policies (user_id, policy_ref, status, coverage_amount, weekly_premium, premium_factors, risk_score, week_start, week_end)
    VALUES (?, ?, 'active', ?, ?, ?, ?, ?, ?)
  `).run(
    req.userId, policyRef, coverage_amount, weekly_premium,
    JSON.stringify(factors), risk_score,
    weekStart.toISOString().split('T')[0],
    weekEnd.toISOString().split('T')[0]
  );

  res.json({
    id: result.lastInsertRowid,
    policy_ref: policyRef,
    status: 'active',
    coverage_amount,
    weekly_premium,
    factors,
    risk_score,
    week_start: weekStart.toISOString().split('T')[0],
    week_end: weekEnd.toISOString().split('T')[0],
  });
});

// GET /api/policy/current
router.get('/current', authMiddleware, (req, res) => {
  const db = getDb();
  const policy = db.prepare(`
    SELECT * FROM policies WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1
  `).get(req.userId);

  if (!policy) return res.status(404).json({ error: 'No active policy' });
  policy.premium_factors = JSON.parse(policy.premium_factors || '{}');
  
  // Calculate days until reset
  const weekEnd = new Date(policy.week_end);
  const now = new Date();
  const daysUntilReset = Math.max(0, Math.ceil((weekEnd - now) / 86400000));
  policy.days_until_reset = daysUntilReset;
  
  res.json(policy);
});

// GET /api/policy/history
router.get('/history', authMiddleware, (req, res) => {
  const db = getDb();
  const policies = db.prepare(`
    SELECT * FROM policies WHERE user_id = ? ORDER BY created_at DESC LIMIT 12
  `).all(req.userId);

  policies.forEach(p => { p.premium_factors = JSON.parse(p.premium_factors || '{}'); });
  res.json(policies);
});

// PUT /api/policy/adjust
router.put('/adjust', authMiddleware, async (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  const { coverage_amount } = req.body;

  const zones = JSON.parse(user.zones || '["Adyar"]');
  const claimStats = db.prepare(`
    SELECT COUNT(*) as count FROM claims WHERE user_id = ? AND created_at > datetime('now', '-28 days')
  `).get(req.userId);

  const payload = {
    user_id: req.userId,
    zones,
    city: user.city || 'Chennai',
    coverage_amount,
    hours_worked: (user.working_hours_end - user.working_hours_start) * (user.work_days || 6),
    claim_count_4w: claimStats?.count || 0,
    aqi_avg: 150,
    rainfall_days_4w: 3,
    demand_drop_events: 1,
    trust_score: user.trust_score || 1.0,
  };

  let premiumData;
  try {
    const mlResponse = await axios.post(`${ML_URL}/calculate-premium`, payload, { timeout: 3000 });
    premiumData = mlResponse.data;
  } catch {
    premiumData = calculatePremiumFallback(payload);
  }

  res.json(premiumData);
});

export default router;
