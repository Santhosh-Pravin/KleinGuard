import { Router } from 'express';
import { getDb } from '../db.js';
import { authMiddleware } from './auth.js';

const router = Router();

// GET /api/triggers/active
router.get('/active', (req, res) => {
  const db = getDb();
  const triggers = db.prepare(`
    SELECT * FROM triggers WHERE is_active = 1 ORDER BY triggered_at DESC
  `).all();
  res.json(triggers);
});

// GET /api/triggers/zone/:zone
router.get('/zone/:zone', (req, res) => {
  const db = getDb();
  const triggers = db.prepare(`
    SELECT * FROM triggers WHERE zone = ? AND is_active = 1 ORDER BY triggered_at DESC
  `).all(req.params.zone);
  res.json(triggers);
});

// POST /api/triggers/check
router.post('/check', authMiddleware, (req, res) => {
  // This is handled by the trigger monitor — just acknowledge
  res.json({ success: true, message: 'Trigger check initiated' });
});

export default router;
