import { Router } from 'express';

const router = Router();

const ZONE_ORDER_BASELINE = {
  'Adyar': 45,
  'Velachery': 38,
  'T. Nagar': 52,
  'Anna Nagar': 48,
  'Tambaram': 30,
  'Perambur': 35,
  'Royapettah': 40,
  'Nungambakkam': 50,
  'Mylapore': 42,
  'Kodambakkam': 36,
};

let forcedDemand = null;

function generateOrders(zone) {
  if (forcedDemand && (!zone || forcedDemand.zone === zone)) {
    return { ...forcedDemand };
  }

  const baseline = ZONE_ORDER_BASELINE[zone] || 40;
  const variation = Math.sin(Date.now() / 25000) * 8 + Math.random() * 6 - 3;
  const current_orders = Math.max(5, Math.round(baseline + variation));
  const drop_pct = Math.round(((baseline - current_orders) / baseline) * 100);

  return {
    zone: zone || 'Adyar',
    current_orders,
    baseline_orders: baseline,
    drop_pct: Math.max(-20, drop_pct),
    worker_online: true,
    peak_hour: new Date().getHours() >= 11 && new Date().getHours() <= 14,
    timestamp: new Date().toISOString()
  };
}

router.get('/', (req, res) => {
  const zone = req.query.zone || 'Adyar';
  res.json(generateOrders(zone));
});

router.get('/all', (req, res) => {
  const zones = Object.keys(ZONE_ORDER_BASELINE);
  res.json(zones.map(z => generateOrders(z)));
});

router.post('/force-demand', (req, res) => {
  const zone = req.body.zone || 'Adyar';
  const baseline = ZONE_ORDER_BASELINE[zone] || 40;
  forcedDemand = {
    zone,
    current_orders: Math.round(baseline * 0.6),
    baseline_orders: baseline,
    drop_pct: 40,
    worker_online: true,
    peak_hour: false,
    timestamp: new Date().toISOString()
  };
  setTimeout(() => { forcedDemand = null; }, 60000);
  res.json({ success: true, trigger: 'demand', ...forcedDemand });
});

export { generateOrders };
export default router;
