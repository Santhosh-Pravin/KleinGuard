import { Router } from 'express';

const router = Router();

// Zone-specific base weather patterns for Chennai
const ZONE_WEATHER = {
  'Adyar': { baseRain: 8, baseTemp: 33, floodProb: 0.72 },
  'Velachery': { baseRain: 7, baseTemp: 33, floodProb: 0.68 },
  'T. Nagar': { baseRain: 4, baseTemp: 34, floodProb: 0.45 },
  'Anna Nagar': { baseRain: 3, baseTemp: 34, floodProb: 0.38 },
  'Tambaram': { baseRain: 9, baseTemp: 32, floodProb: 0.81 },
  'Perambur': { baseRain: 5, baseTemp: 34, floodProb: 0.52 },
  'Royapettah': { baseRain: 4, baseTemp: 34, floodProb: 0.42 },
  'Nungambakkam': { baseRain: 3, baseTemp: 35, floodProb: 0.35 },
  'Mylapore': { baseRain: 5, baseTemp: 33, floodProb: 0.55 },
  'Kodambakkam': { baseRain: 4, baseTemp: 34, floodProb: 0.40 },
};

// State to track forced triggers
let forcedWeather = null;

function getTimeVariation() {
  const now = Date.now();
  // Slowly varying value based on time — changes every ~10 seconds
  return Math.sin(now / 10000) * 0.5 + Math.sin(now / 30000) * 0.3;
}

function isMonsoonHour() {
  const hour = new Date().getHours();
  return hour % 6 === 0 || hour % 6 === 1;
}

function generateWeather(zone) {
  if (forcedWeather && (!zone || forcedWeather.zone === zone)) {
    const result = { ...forcedWeather };
    return result;
  }

  const config = ZONE_WEATHER[zone] || ZONE_WEATHER['Adyar'];
  const variation = getTimeVariation();
  const monsoonBonus = isMonsoonHour() ? 8 : 0;
  
  const rainfall_mm = Math.max(0, Math.round((config.baseRain + variation * 6 + monsoonBonus + (Math.random() * 4 - 2)) * 10) / 10);
  const temp_c = Math.round((config.baseTemp + variation * 3 + (Math.random() * 2 - 1)) * 10) / 10;
  
  let condition = 'Clear';
  let risk_level = 'low';
  
  if (rainfall_mm > 25) { condition = 'Heavy Rain'; risk_level = 'critical'; }
  else if (rainfall_mm > 15) { condition = 'Moderate Rain'; risk_level = 'high'; }
  else if (rainfall_mm > 5) { condition = 'Light Rain'; risk_level = 'medium'; }
  else if (rainfall_mm > 0) { condition = 'Drizzle'; risk_level = 'low'; }
  else if (temp_c > 42) { condition = 'Extreme Heat'; risk_level = 'high'; }
  else if (temp_c > 38) { condition = 'Hot'; risk_level = 'medium'; }
  else { condition = 'Clear'; risk_level = 'low'; }
  
  const flood_alert = rainfall_mm > 30 || (rainfall_mm > 20 && config.floodProb > 0.65);
  
  return {
    zone: zone || 'Adyar',
    rainfall_mm,
    temp_c,
    condition,
    risk_level,
    flood_alert,
    humidity: Math.round(55 + rainfall_mm * 1.2 + Math.random() * 15),
    wind_kmh: Math.round(8 + Math.random() * 20),
    timestamp: new Date().toISOString()
  };
}

// GET /api/mock/weather?zone=Adyar
router.get('/', (req, res) => {
  const zone = req.query.zone || 'Adyar';
  res.json(generateWeather(zone));
});

// GET /api/mock/weather/all — all zones at once
router.get('/all', (req, res) => {
  const zones = Object.keys(ZONE_WEATHER);
  const results = zones.map(z => generateWeather(z));
  res.json(results);
});

// POST /api/mock/force-trigger/rain
router.post('/force-rain', (req, res) => {
  const zone = req.body.zone || 'Adyar';
  forcedWeather = {
    zone,
    rainfall_mm: 28,
    temp_c: 29,
    condition: 'Heavy Rain',
    risk_level: 'critical',
    flood_alert: false,
    humidity: 92,
    wind_kmh: 25,
    timestamp: new Date().toISOString()
  };
  setTimeout(() => { forcedWeather = null; }, 60000); // Reset after 60s
  res.json({ success: true, trigger: 'rain', zone, ...forcedWeather });
});

// POST /api/mock/force-trigger/flood
router.post('/force-flood', (req, res) => {
  const zone = req.body.zone || 'Adyar';
  forcedWeather = {
    zone,
    rainfall_mm: 45,
    temp_c: 27,
    condition: 'Heavy Rain',
    risk_level: 'critical',
    flood_alert: true,
    humidity: 96,
    wind_kmh: 30,
    timestamp: new Date().toISOString()
  };
  setTimeout(() => { forcedWeather = null; }, 60000);
  res.json({ success: true, trigger: 'flood', zone, ...forcedWeather });
});

// POST /api/mock/force-trigger/heat
router.post('/force-heat', (req, res) => {
  const zone = req.body.zone || 'Adyar';
  forcedWeather = {
    zone,
    rainfall_mm: 0,
    temp_c: 44.5,
    condition: 'Extreme Heat',
    risk_level: 'critical',
    flood_alert: false,
    humidity: 35,
    wind_kmh: 5,
    timestamp: new Date().toISOString()
  };
  setTimeout(() => { forcedWeather = null; }, 60000);
  res.json({ success: true, trigger: 'heat', zone, ...forcedWeather });
});

export { generateWeather };
export default router;
