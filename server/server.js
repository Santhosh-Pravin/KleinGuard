import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { getDb, seedDemoData } from './db.js';
import { TriggerMonitor } from './triggerMonitor.js';

// Route imports
import authRouter from './routes/auth.js';
import policyRouter from './routes/policy.js';
import premiumRouter from './routes/premium.js';
import claimsRouter from './routes/claims.js';
import triggersRouter from './routes/triggers.js';

// Mock API imports
import weatherRouter from './mockApis/weather.js';
import aqiRouter from './mockApis/aqi.js';
import trafficRouter from './mockApis/traffic.js';
import platformRouter from './mockApis/platform.js';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

const PORT = process.env.PORT || 3001;
const DEMO_MODE = process.env.DEMO_MODE === 'true';

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
getDb();

// If demo mode, seed data on startup
if (DEMO_MODE) {
  console.log('[Server] Demo mode — seeding data...');
  seedDemoData();
}

// =====================
//   API Routes
// =====================
app.use('/api/auth', authRouter);
app.use('/api/policy', policyRouter);
app.use('/api/premium', premiumRouter);
app.use('/api/claims', claimsRouter);
app.use('/api/triggers', triggersRouter);

// =====================
//   Mock External APIs
// =====================
app.use('/api/mock/weather', weatherRouter);
app.use('/api/mock/aqi', aqiRouter);
app.use('/api/mock/traffic', trafficRouter);
app.use('/api/mock/platform/orders', platformRouter);

// Force trigger routes — unified endpoint
app.post('/api/mock/force-trigger/:type', async (req, res) => {
  const { type } = req.params;
  const zone = req.body.zone || 'Adyar';
  const severity = req.body.severity || 'high';
  const instant = req.body.instant || false;
  
  // Set mock values for the simulation based on trigger type and severity
  let rawValue, threshold;
  if (type === 'rain') { rawValue = severity === 'critical' ? 45 : 20; threshold = 15; }
  else if (type === 'flood') { rawValue = severity === 'critical' ? 60 : 35; threshold = 30; }
  else if (type === 'heat') { rawValue = severity === 'critical' ? 46 : 43; threshold = 42; }
  else if (type === 'aqi') { rawValue = severity === 'critical' ? 450 : 300; threshold = 200; }
  else if (type === 'demand') { rawValue = severity === 'critical' ? 60 : 25; threshold = 10; }
  else if (type === 'traffic') { rawValue = severity === 'critical' ? 0.9 : 0.8; threshold = 0.75; }
  else { rawValue = 10; threshold = 5; }

  try {
    await triggerMonitor.fireTrigger(type, zone, rawValue, threshold, severity, instant);
    res.json({ success: true, type, zone, severity, instant, message: `Admin Simulation: ${type.toUpperCase()} triggered in ${zone} with ${severity} severity. (Instant: ${instant})` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Demo reset endpoint
app.post('/api/demo/reset', (req, res) => {
  seedDemoData();
  res.json({ success: true, message: 'Demo data reset' });
});

// Earnings endpoint
app.get('/api/earnings', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  
  try {
    const decoded = jwt.verify(token, 'kleinguard_hackathon_secret_2024');
    const db = getDb();
    const earnings = db.prepare(`
      SELECT * FROM earnings WHERE user_id = ? ORDER BY date DESC LIMIT 7
    `).all(decoded.userId);
    res.json(earnings);
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', demo: DEMO_MODE, timestamp: new Date().toISOString() });
});

// =====================
//   Socket.io
// =====================
io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`[Socket] User ${userId} joined room user_${userId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// =====================
//   Start Server
// =====================
const triggerMonitor = new TriggerMonitor(io);

httpServer.listen(PORT, () => {
  console.log(`\n  ╔══════════════════════════════════════╗`);
  console.log(`  ║     KleinGuard API Server            ║`);
  console.log(`  ║     Port: ${PORT}                        ║`);
  console.log(`  ║     Demo: ${DEMO_MODE ? 'ON ' : 'OFF'}                        ║`);
  console.log(`  ╚══════════════════════════════════════╝\n`);
  
  triggerMonitor.start();
});

export { io };
