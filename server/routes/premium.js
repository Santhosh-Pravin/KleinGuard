import { Router } from 'express';
import { getDb } from '../db.js';
import { authMiddleware } from './auth.js';
import axios from 'axios';

const router = Router();
const ML_URL = 'http://localhost:5001';

// POST /api/premium/calculate
router.post('/calculate', authMiddleware, async (req, res) => {
  try {
    const mlResponse = await axios.post(`${ML_URL}/calculate-premium`, req.body, { timeout: 3000 });
    res.json(mlResponse.data);
  } catch {
    // Inline fallback
    const data = req.body;
    const base = 45;
    const coverage = (data.coverage_amount || 2000) / 2000;
    const premium = Math.round(base * 0.82 * 0.91 * 0.74 * 0.95 * 1.0 * coverage);
    res.json({
      weekly_premium: premium,
      coverage_amount: data.coverage_amount || 2000,
      factors: { base_rate: 45, zone_risk: 0.82, aqi_exposure: 0.91, demand_volatility: 0.74, behavior_score: 0.95, claim_history: 1.0 },
      risk_score: 0.71,
      risk_tier: 'medium',
    });
  }
});

// GET /api/premium/factors/:userId
router.get('/factors/:userId', authMiddleware, (req, res) => {
  const db = getDb();
  const policy = db.prepare(`
    SELECT premium_factors FROM policies WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1
  `).get(req.params.userId);

  if (!policy) return res.json({ base_rate: 45, zone_risk: 0.82, aqi_exposure: 0.91, demand_volatility: 0.74, behavior_score: 0.95, claim_history: 1.0 });
  res.json(JSON.parse(policy.premium_factors));
});

// GET /api/premium/history/:userId
router.get('/history/:userId', authMiddleware, (req, res) => {
  const db = getDb();
  const policies = db.prepare(`
    SELECT weekly_premium, week_start, premium_factors FROM policies WHERE user_id = ? ORDER BY created_at DESC LIMIT 8
  `).all(req.params.userId);

  if (policies.length === 0) {
    // Generate mock 8-week history
    const history = [];
    const basePremiums = [48, 52, 50, 55, 52, 49, 53, 52];
    for (let i = 7; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i * 7);
      history.push({
        week: `W${8 - i}`,
        week_start: date.toISOString().split('T')[0],
        weekly_premium: basePremiums[7 - i],
      });
    }
    return res.json(history);
  }

  res.json(policies.map((p, i) => ({
    week: `W${policies.length - i}`,
    week_start: p.week_start,
    weekly_premium: p.weekly_premium,
  })));
});

export default router;
