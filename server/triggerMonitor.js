import { getDb } from './db.js';
import { generateWeather } from './mockApis/weather.js';
import { generateAqi } from './mockApis/aqi.js';
import { generateTraffic } from './mockApis/traffic.js';
import { generateOrders } from './mockApis/platform.js';
import { processAutoClaim } from './claimsProcessor.js';

const ZONES = ['Adyar', 'Velachery', 'T. Nagar', 'Anna Nagar', 'Tambaram', 'Perambur', 'Royapettah', 'Nungambakkam', 'Mylapore', 'Kodambakkam'];

export class TriggerMonitor {
  constructor(io) {
    this.io = io;
    this.demoMode = process.env.DEMO_MODE === 'true';
    this.checkInterval = this.demoMode ? 8000 : 30000;
    this.thresholds = {
      rain_mm: 15,
      temp_c: 42,
      aqi: 400,
      demand_drop_pct: 10,
      traffic_congestion: 0.75,
    };
    this.intervalId = null;
  }

  start() {
    console.log(`[TriggerMonitor] Started — checking every ${this.checkInterval / 1000}s (demo: ${this.demoMode})`);
    this.intervalId = setInterval(() => this.runChecks(), this.checkInterval);
    // Initial check after 5s
    setTimeout(() => this.runChecks(), 5000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async runChecks() {
    const db = getDb();
    
    // Get all zones that have active policies
    const activePolicies = db.prepare(`
      SELECT DISTINCT u.zones FROM users u
      JOIN policies p ON u.id = p.user_id
      WHERE p.status = 'active'
    `).all();

    const monitoredZones = new Set();
    activePolicies.forEach(p => {
      try {
        const zones = JSON.parse(p.zones || '[]');
        zones.forEach(z => monitoredZones.add(z));
      } catch {}
    });

    if (monitoredZones.size === 0) return;

    const conditionsUpdate = {};

    for (const zone of monitoredZones) {
      const weather = generateWeather(zone);
      const aqi = generateAqi(zone);
      const traffic = generateTraffic(zone);
      const orders = generateOrders(zone);

      conditionsUpdate[zone] = { weather, aqi, traffic, orders };

      // Check rain trigger
      if (weather.rainfall_mm > this.thresholds.rain_mm) {
        await this.fireTrigger('rain', zone, weather.rainfall_mm, this.thresholds.rain_mm,
          weather.rainfall_mm > 25 ? 'high' : 'medium');
      }

      // Check flood (combo trigger)
      if (weather.rainfall_mm > 30 && weather.flood_alert) {
        await this.fireTrigger('flood', zone, weather.rainfall_mm, 30, 'critical');
      }

      // Check heat
      if (weather.temp_c > this.thresholds.temp_c) {
        await this.fireTrigger('heat', zone, weather.temp_c, this.thresholds.temp_c,
          weather.temp_c > 45 ? 'critical' : 'high');
      }

      // Check AQI
      if (aqi.aqi_value > this.thresholds.aqi) {
        await this.fireTrigger('aqi', zone, aqi.aqi_value, this.thresholds.aqi, 'critical');
      }

      // Check demand drop
      if (orders.drop_pct > this.thresholds.demand_drop_pct) {
        await this.fireTrigger('demand', zone, orders.drop_pct, this.thresholds.demand_drop_pct,
          orders.drop_pct > 50 ? 'high' : 'medium');
      }

      // Check traffic
      if (traffic.congestion_index > this.thresholds.traffic_congestion) {
        await this.fireTrigger('traffic', zone, traffic.congestion_index, this.thresholds.traffic_congestion, 'high');
      }
    }

    // Emit conditions update to all connected clients
    this.io?.emit('conditions:update', conditionsUpdate);
  }

  async fireTrigger(type, zone, rawValue, threshold, severity) {
    const db = getDb();

    // Check for duplicate — don't fire same trigger type+zone within 5 minutes
    const recent = db.prepare(`
      SELECT id FROM triggers 
      WHERE type = ? AND zone = ? AND is_active = 1 
      AND triggered_at > datetime('now', '-5 minutes')
    `).get(type, zone);

    if (recent) return;

    // Insert trigger record
    const result = db.prepare(`
      INSERT INTO triggers (type, zone, severity, raw_value, threshold)
      VALUES (?, ?, ?, ?, ?)
    `).run(type, zone, severity, rawValue, threshold);

    const triggerId = result.lastInsertRowid;
    const trigger = { id: triggerId, type, zone, severity, raw_value: rawValue, threshold };

    console.log(`[TriggerMonitor] 🔔 ${type.toUpperCase()} trigger in ${zone} — value: ${rawValue} (threshold: ${threshold})`);

    // Emit trigger event
    this.io?.emit('trigger:new', trigger);

    // Process auto-claims for affected users
    const affectedUsers = this.getAffectedUsers(zone);
    for (const user of affectedUsers) {
      try {
        const claim = await processAutoClaim(user, trigger, this.io);
        if (claim) {
          console.log(`[TriggerMonitor] Claim ${claim.id} created for user ${user.id} — status: ${claim.status}`);
        }
      } catch (err) {
        console.error(`[TriggerMonitor] Error processing claim for user ${user.id}:`, err.message);
      }
    }

    // Auto-resolve trigger after 2 hours (or 30s in demo mode)
    const resolveDelay = this.demoMode ? 30000 : 7200000;
    setTimeout(() => {
      db.prepare("UPDATE triggers SET is_active = 0, resolved_at = datetime('now') WHERE id = ?").run(triggerId);
    }, resolveDelay);
  }

  getAffectedUsers(zone) {
    const db = getDb();
    const users = db.prepare(`
      SELECT u.* FROM users u
      JOIN policies p ON u.id = p.user_id
      WHERE p.status = 'active'
    `).all();

    return users.filter(u => {
      try {
        const zones = JSON.parse(u.zones || '[]');
        return zones.includes(zone);
      } catch { return false; }
    });
  }
}
