import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, 'kleinguard.db');

let db;

export function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeSchema();
  }
  return db;
}

function initializeSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      city TEXT,
      platform TEXT,
      weekly_income INTEGER,
      working_hours_start INTEGER,
      working_hours_end INTEGER,
      zones TEXT,
      work_days INTEGER,
      trust_score REAL DEFAULT 1.0,
      is_working BOOLEAN DEFAULT 0,
      current_location TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS policies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      policy_ref TEXT UNIQUE,
      status TEXT DEFAULT 'active',
      coverage_amount INTEGER,
      weekly_premium INTEGER,
      premium_factors TEXT,
      risk_score REAL,
      week_start DATE,
      week_end DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS triggers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT,
      zone TEXT,
      severity TEXT,
      raw_value REAL,
      threshold REAL,
      triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      is_active BOOLEAN DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS claims (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      policy_id INTEGER REFERENCES policies(id),
      trigger_id INTEGER REFERENCES triggers(id),
      status TEXT DEFAULT 'pending',
      expected_income REAL,
      actual_income REAL,
      payout_amount REAL,
      fraud_score REAL DEFAULT 0.0,
      location_valid BOOLEAN,
      platform_active BOOLEAN,
      signal_summary TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS earnings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      date DATE,
      amount REAL,
      orders_completed INTEGER,
      hours_worked REAL,
      zone TEXT
    );
  `);
}

export function seedDemoData() {
  const db = getDb();

  // Clean only Mani's existing data to isolate history from new registrations
  const existingMani = db.prepare(`SELECT id FROM users WHERE phone = '+919876543210'`).get();
  if (existingMani) {
    const mId = existingMani.id;
    db.exec(`DELETE FROM earnings WHERE user_id = ${mId}; DELETE FROM claims WHERE user_id = ${mId}; DELETE FROM policies WHERE user_id = ${mId}; DELETE FROM users WHERE id = ${mId};`);
  }
  db.exec('DELETE FROM triggers WHERE id NOT IN (SELECT trigger_id FROM claims);');

  // Create demo user: Mani
  const insertUser = db.prepare(`
    INSERT INTO users (name, phone, city, platform, weekly_income, working_hours_start, working_hours_end, zones, work_days, trust_score, is_working, current_location)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL)
  `);

  const userResult = insertUser.run(
    'Mani',
    '+919876543210',
    'Chennai',
    'Zepto',
    12000,
    9,
    21,
    JSON.stringify(['Adyar', 'Velachery', 'T. Nagar']),
    6,
    0.94
  );

  const userId = userResult.lastInsertRowid;

  // Create active policy
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const insertPolicy = db.prepare(`
    INSERT INTO policies (user_id, policy_ref, status, coverage_amount, weekly_premium, premium_factors, risk_score, week_start, week_end)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const policyResult = insertPolicy.run(
    userId,
    'KG-CHN-2024-001847',
    'active',
    2000,
    52,
    JSON.stringify({
      base_rate: 45,
      zone_risk: 0.82,
      aqi_exposure: 0.91,
      demand_volatility: 0.74,
      behavior_score: 0.95,
      claim_history: 1.00
    }),
    0.71,
    weekStart.toISOString().split('T')[0],
    weekEnd.toISOString().split('T')[0]
  );

  const policyId = policyResult.lastInsertRowid;

  // Create 7 days of earnings
  const insertEarning = db.prepare(`
    INSERT INTO earnings (user_id, date, amount, orders_completed, hours_worked, zone)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const zones = ['Adyar', 'Velachery', 'T. Nagar'];
  const dailyAmounts = [320, 280, 0, 350, 310, 290, 290];
  const dailyOrders = [14, 12, 0, 16, 13, 12, 13];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    insertEarning.run(
      userId,
      date.toISOString().split('T')[0],
      dailyAmounts[6 - i],
      dailyOrders[6 - i],
      dailyAmounts[6 - i] > 0 ? 7 + Math.random() * 3 : 0,
      zones[Math.floor(Math.random() * zones.length)]
    );
  }

  // Create 4 historical claims
  const insertClaim = db.prepare(`
    INSERT INTO claims (user_id, policy_id, trigger_id, status, expected_income, actual_income, payout_amount, fraud_score, location_valid, platform_active, signal_summary, created_at, resolved_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertTrigger = db.prepare(`
    INSERT INTO triggers (type, zone, severity, raw_value, threshold, triggered_at, resolved_at, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Claim 1: Rain — Paid
  const t1 = insertTrigger.run('rain', 'Adyar', 'high', 28, 15,
    new Date(today.getTime() - 3 * 86400000).toISOString(),
    new Date(today.getTime() - 3 * 86400000 + 7200000).toISOString(), 0);
  insertClaim.run(userId, policyId, t1.lastInsertRowid, 'paid', 400, 120, 280, 0.08, 1, 1,
    JSON.stringify({ weather: 'heavy_rain', zone_match: true, platform_online: true, earnings_drop: 70 }),
    new Date(today.getTime() - 3 * 86400000).toISOString(),
    new Date(today.getTime() - 3 * 86400000 + 300000).toISOString());

  // Claim 2: AQI — Paid
  const t2 = insertTrigger.run('aqi', 'Velachery', 'critical', 445, 400,
    new Date(today.getTime() - 5 * 86400000).toISOString(),
    new Date(today.getTime() - 5 * 86400000 + 10800000).toISOString(), 0);
  insertClaim.run(userId, policyId, t2.lastInsertRowid, 'paid', 380, 190, 190, 0.05, 1, 1,
    JSON.stringify({ aqi_reading: 445, zone_match: true, platform_online: true, earnings_drop: 50 }),
    new Date(today.getTime() - 5 * 86400000).toISOString(),
    new Date(today.getTime() - 5 * 86400000 + 600000).toISOString());

  // Claim 3: Demand — Under Review
  const t3 = insertTrigger.run('demand', 'T. Nagar', 'medium', 35, 30,
    new Date(today.getTime() - 1 * 86400000).toISOString(),
    null, 0);
  insertClaim.run(userId, policyId, t3.lastInsertRowid, 'under_review', 350, 230, 120, 0.42, 1, 1,
    JSON.stringify({ demand_drop: 35, zone_match: true, platform_online: true, earnings_drop: 34, review_reason: 'moderate_fraud_score' }),
    new Date(today.getTime() - 1 * 86400000).toISOString(), null);

  // Claim 4: Heat — Auto-approved
  const t4 = insertTrigger.run('heat', 'Adyar', 'high', 44.2, 42,
    new Date(today.getTime() - 7 * 86400000).toISOString(),
    new Date(today.getTime() - 7 * 86400000 + 14400000).toISOString(), 0);
  insertClaim.run(userId, policyId, t4.lastInsertRowid, 'paid', 420, 180, 240, 0.11, 1, 1,
    JSON.stringify({ temperature: 44.2, zone_match: true, platform_online: true, earnings_drop: 57 }),
    new Date(today.getTime() - 7 * 86400000).toISOString(),
    new Date(today.getTime() - 7 * 86400000 + 180000).toISOString());

  console.log('Demo data seeded successfully — User: Mani, Policy: KG-CHN-2024-001847');
}

// Run seed if called directly: node db.js seed
if (process.argv[2] === 'seed') {
  seedDemoData();
  process.exit(0);
}
