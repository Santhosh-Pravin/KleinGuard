import { Router } from 'express';
import { getDb } from '../db.js';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = 'kleinguard_hackathon_secret_2024';

// Middleware to extract user from JWT
export function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { name, phone, city, platform, weekly_income, working_hours_start, working_hours_end, zones, work_days } = req.body;
  const db = getDb();

  try {
    // Check if user exists
    const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
    if (existing) {
      const token = jwt.sign({ userId: existing.id }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ token, userId: existing.id, existing: true });
    }

    const result = db.prepare(`
      INSERT INTO users (name, phone, city, platform, weekly_income, working_hours_start, working_hours_end, zones, work_days)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, phone, city, platform, weekly_income, working_hours_start, working_hours_end,
      typeof zones === 'string' ? zones : JSON.stringify(zones), work_days);

    const token = jwt.sign({ userId: result.lastInsertRowid }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, userId: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/otp/send
router.post('/otp/send', (req, res) => {
  const { phone } = req.body;
  console.log(`[OTP] Sent mock OTP 123456 to ${phone}`);
  res.json({ success: true, message: 'OTP sent' });
});

// POST /api/auth/otp/verify
router.post('/otp/verify', (req, res) => {
  const { phone, otp } = req.body;
  if (otp === '123456') {
    // Check if user exists
    const db = getDb();
    const user = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
    if (user) {
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ valid: true, token, userId: user.id, existing: true });
    }
    return res.json({ valid: true });
  }
  res.status(400).json({ valid: false, error: 'Invalid OTP' });
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.zones = JSON.parse(user.zones || '[]');
  res.json(user);
});

// PUT /api/auth/update
router.put('/update', authMiddleware, (req, res) => {
  const { zones, work_days, city, platform, weekly_income, working_hours_start, working_hours_end } = req.body;
  const db = getDb();
  
  const updates = [];
  const values = [];
  
  if (zones !== undefined) { updates.push('zones = ?'); values.push(JSON.stringify(zones)); }
  if (work_days !== undefined) { updates.push('work_days = ?'); values.push(work_days); }
  if (city !== undefined) { updates.push('city = ?'); values.push(city); }
  if (platform !== undefined) { updates.push('platform = ?'); values.push(platform); }
  if (weekly_income !== undefined) { updates.push('weekly_income = ?'); values.push(weekly_income); }
  if (working_hours_start !== undefined) { updates.push('working_hours_start = ?'); values.push(working_hours_start); }
  if (working_hours_end !== undefined) { updates.push('working_hours_end = ?'); values.push(working_hours_end); }
  
  if (updates.length === 0) return res.json({ success: true });
  
  values.push(req.userId);
  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  user.zones = JSON.parse(user.zones || '[]');
  res.json(user);
});

// POST /api/auth/duty
router.post('/duty', authMiddleware, (req, res) => {
  const { is_working, current_location } = req.body;
  const db = getDb();
  
  db.prepare(`UPDATE users SET is_working = ?, current_location = ? WHERE id = ?`).run(
    is_working ? 1 : 0, 
    current_location || null, 
    req.userId
  );
  
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  user.zones = JSON.parse(user.zones || '[]');
  res.json(user);
});

export { JWT_SECRET };
export default router;
