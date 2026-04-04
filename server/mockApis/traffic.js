import { Router } from 'express';

const router = Router();

const ZONE_TRAFFIC_BASE = {
  'Adyar': 0.45,
  'Velachery': 0.52,
  'T. Nagar': 0.65,
  'Anna Nagar': 0.42,
  'Tambaram': 0.58,
  'Perambur': 0.48,
  'Royapettah': 0.55,
  'Nungambakkam': 0.50,
  'Mylapore': 0.47,
  'Kodambakkam': 0.53,
};

let forcedTraffic = null;

function isRushHour() {
  const hour = new Date().getHours();
  return (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20);
}

function generateTraffic(zone) {
  if (forcedTraffic && (!zone || forcedTraffic.zone === zone)) {
    return { ...forcedTraffic };
  }

  const base = ZONE_TRAFFIC_BASE[zone] || 0.50;
  const rushBonus = isRushHour() ? 0.2 : 0;
  const variation = Math.sin(Date.now() / 20000) * 0.1 + Math.random() * 0.1 - 0.05;
  
  const congestion_index = Math.max(0.05, Math.min(0.98, base + rushBonus + variation));
  const avg_delay_mins = Math.round(congestion_index * 22 + Math.random() * 5);

  let level = 'LOW';
  if (congestion_index > 0.75) level = 'HIGH';
  else if (congestion_index > 0.45) level = 'MED';

  return {
    zone: zone || 'Adyar',
    congestion_index: Math.round(congestion_index * 100) / 100,
    avg_delay_mins,
    level,
    timestamp: new Date().toISOString()
  };
}

router.get('/', (req, res) => {
  const zone = req.query.zone || 'Adyar';
  res.json(generateTraffic(zone));
});

router.get('/all', (req, res) => {
  const zones = Object.keys(ZONE_TRAFFIC_BASE);
  res.json(zones.map(z => generateTraffic(z)));
});

router.post('/force-traffic', (req, res) => {
  const zone = req.body.zone || 'Adyar';
  forcedTraffic = {
    zone,
    congestion_index: 0.88,
    avg_delay_mins: 24,
    level: 'HIGH',
    timestamp: new Date().toISOString()
  };
  setTimeout(() => { forcedTraffic = null; }, 60000);
  res.json({ success: true, trigger: 'traffic', ...forcedTraffic });
});

export { generateTraffic };
export default router;
