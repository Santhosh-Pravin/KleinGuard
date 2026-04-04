import { Router } from 'express';
import { getDb } from '../db.js';
import { authMiddleware } from './auth.js';

const router = Router();

// GET /api/claims
router.get('/', authMiddleware, (req, res) => {
  const db = getDb();
  const claims = db.prepare(`
    SELECT c.*, t.type as trigger_type, t.zone as trigger_zone, t.severity, t.raw_value
    FROM claims c
    LEFT JOIN triggers t ON c.trigger_id = t.id
    WHERE c.user_id = ?
    ORDER BY c.created_at DESC
  `).all(req.userId);

  claims.forEach(c => {
    c.signal_summary = JSON.parse(c.signal_summary || '{}');
  });

  res.json(claims);
});

// GET /api/claims/stats
router.get('/stats', authMiddleware, (req, res) => {
  const db = getDb();
  
  const totalPaid = db.prepare(`
    SELECT COALESCE(SUM(payout_amount), 0) as total FROM claims WHERE user_id = ? AND status = 'paid'
  `).get(req.userId);
  
  const weeklyPaid = db.prepare(`
    SELECT COALESCE(SUM(payout_amount), 0) as total FROM claims 
    WHERE user_id = ? AND status = 'paid' AND created_at > datetime('now', '-7 days')
  `).get(req.userId);
  
  const pending = db.prepare(`
    SELECT COUNT(*) as count FROM claims WHERE user_id = ? AND status IN ('pending', 'under_review', 'auto_approved')
  `).get(req.userId);

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM claims WHERE user_id = ?
  `).get(req.userId);

  res.json({
    total_paid: totalPaid.total,
    weekly_paid: weeklyPaid.total,
    pending_count: pending.count,
    total_claims: total.count,
  });
});

// GET /api/claims/:id
router.get('/:id', authMiddleware, (req, res) => {
  const db = getDb();
  const claim = db.prepare(`
    SELECT c.*, t.type as trigger_type, t.zone as trigger_zone, t.severity, t.raw_value, t.threshold
    FROM claims c
    LEFT JOIN triggers t ON c.trigger_id = t.id
    WHERE c.id = ? AND c.user_id = ?
  `).get(req.params.id, req.userId);

  if (!claim) return res.status(404).json({ error: 'Claim not found' });
  claim.signal_summary = JSON.parse(claim.signal_summary || '{}');
  res.json(claim);
});

// PUT /api/claims/:id/payout
router.put('/:id/payout', authMiddleware, (req, res) => {
  const db = getDb();
  
  // Simulate 2s payout delay
  setTimeout(() => {
    db.prepare(`
      UPDATE claims SET status = 'paid', resolved_at = datetime('now') WHERE id = ? AND user_id = ?
    `).run(req.params.id, req.userId);

    const claim = db.prepare('SELECT * FROM claims WHERE id = ?').get(req.params.id);
    claim.signal_summary = JSON.parse(claim.signal_summary || '{}');
    res.json(claim);
  }, 2000);
});

// POST /api/claims/reset — for demo mode
router.post('/reset', authMiddleware, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM claims WHERE user_id = ?').run(req.userId);
  db.prepare('UPDATE triggers SET is_active = 0').run();
  res.json({ success: true, message: 'Claims and triggers reset' });
});

export default router;
