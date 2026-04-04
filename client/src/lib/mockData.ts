export const CITY_ZONES: Record<string, string[]> = {
  'Chennai': ['Adyar', 'Velachery', 'T. Nagar', 'Anna Nagar', 'Tambaram', 'Perambur', 'Royapettah', 'Nungambakkam', 'Mylapore', 'Kodambakkam'],
  'Mumbai': ['Andheri', 'Bandra', 'Dadar', 'Kurla', 'Thane', 'Borivali', 'Malad', 'Goregaon', 'Powai', 'Worli'],
  'Delhi': ['Dwarka', 'Rohini', 'Saket', 'Janakpuri', 'Pitampura', 'Lajpat Nagar', 'Karol Bagh', 'Connaught Place'],
  'Bengaluru': ['Koramangala', 'Indiranagar', 'Whitefield', 'HSR Layout', 'Jayanagar', 'BTM Layout', 'Electronic City', 'Marathahalli'],
  'Hyderabad': ['Madhapur', 'Gachibowli', 'Banjara Hills', 'Kukatpally', 'Secunderabad', 'Ameerpet', 'Jubilee Hills'],
  'Pune': ['Kothrud', 'Hinjewadi', 'Viman Nagar', 'Baner', 'Wakad', 'Hadapsar', 'Aundh', 'Shivajinagar'],
};

export const CITIES = Object.keys(CITY_ZONES);

export const PLATFORMS = [
  { id: 'zepto', name: 'Zepto', color: '#FF6B35', emoji: '🟠' },
  { id: 'blinkit', name: 'Blinkit', color: '#00B140', emoji: '🟢' },
  { id: 'swiggy', name: 'Swiggy Instamart', color: '#FC8019', emoji: '🔴' },
];

export const TRIGGER_INFO = [
  { type: 'rain', emoji: '🌧', label: 'Rain', threshold: '>15mm rainfall', description: 'Heavy rainfall reduces delivery capacity' },
  { type: 'flood', emoji: '🌊', label: 'Flood', threshold: 'Zone alert issued', description: 'Flooding makes deliveries unsafe' },
  { type: 'heat', emoji: '🔥', label: 'Extreme Heat', threshold: 'Temp >42°C', description: 'Dangerous heat conditions' },
  { type: 'aqi', emoji: '🌫', label: 'Hazardous AQI', threshold: 'Index >400', description: 'Air quality unsafe for outdoor work' },
  { type: 'demand', emoji: '📉', label: 'Demand Drop', threshold: 'Orders drop >30%', description: 'Sudden reduction in delivery orders' },
  { type: 'traffic', emoji: '🚗', label: 'High Traffic', threshold: 'High congestion index', description: 'Severe traffic reduces earnings' },
];

export const WORK_DAYS_OPTIONS = [3, 4, 5, 6, 7];

export const COVERAGE_ITEMS = [
  'Rain + Flood',
  'Extreme Heat',
  'Hazardous AQI',
  'Demand Shock',
  'Traffic Disruption',
];
