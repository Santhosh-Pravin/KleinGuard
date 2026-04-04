import { Router } from 'express';

const router = Router();

const ZONE_AQI_BASE = {
  'Adyar': 120,
  'Velachery': 145,
  'T. Nagar': 160,
  'Anna Nagar': 110,
  'Tambaram': 135,
  'Perambur': 175,
  'Royapettah': 155,
  'Nungambakkam': 105,
  'Mylapore': 125,
  'Kodambakkam': 140,
};

let forcedAqi = null;

function getCategory(aqi) {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Satisfactory';
  if (aqi <= 200) return 'Moderate';
  if (aqi <= 300) return 'Poor';
  if (aqi <= 400) return 'Very Poor';
  return 'Hazardous';
}

function generateAqi(zone) {
  if (forcedAqi && (!zone || forcedAqi.zone === zone)) {
    return { ...forcedAqi };
  }

  const base = ZONE_AQI_BASE[zone] || 130;
  const variation = Math.sin(Date.now() / 15000) * 30 + Math.sin(Date.now() / 45000) * 20;
  const aqi_value = Math.max(20, Math.round(base + variation + (Math.random() * 40 - 20)));
  const pm25 = Math.round(aqi_value * 0.42 + Math.random() * 10);

  return {
    zone: zone || 'Adyar',
    aqi_value,
    category: getCategory(aqi_value),
    pm25,
    pm10: Math.round(pm25 * 1.6 + Math.random() * 15),
    timestamp: new Date().toISOString()
  };
}

router.get('/', (req, res) => {
  const zone = req.query.zone || 'Adyar';
  res.json(generateAqi(zone));
});

router.get('/all', (req, res) => {
  const zones = Object.keys(ZONE_AQI_BASE);
  res.json(zones.map(z => generateAqi(z)));
});

router.post('/force-aqi', (req, res) => {
  const zone = req.body.zone || 'Adyar';
  forcedAqi = {
    zone,
    aqi_value: 445,
    category: 'Hazardous',
    pm25: 210,
    pm10: 350,
    timestamp: new Date().toISOString()
  };
  setTimeout(() => { forcedAqi = null; }, 60000);
  res.json({ success: true, trigger: 'aqi', ...forcedAqi });
});

export { generateAqi };
export default router;
