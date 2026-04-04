/**
 * Format a number as Indian Rupee currency
 * e.g. 1240 → ₹1,240
 */
export function formatINR(amount: number): string {
  if (amount === 0) return '₹0';
  const isNeg = amount < 0;
  const num = Math.abs(Math.round(amount));
  const str = num.toString();
  
  // Indian number system: last 3 digits, then groups of 2
  if (str.length <= 3) return `${isNeg ? '-' : ''}₹${str}`;
  
  const last3 = str.slice(-3);
  const rest = str.slice(0, -3);
  const formatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
  return `${isNeg ? '-' : ''}₹${formatted}`;
}

/**
 * Format a date as human-readable timestamp
 * e.g. "Today, 2:34 PM" / "Yesterday, 11:18 AM" / "Mon, Jan 15"
 */
export function formatTime(dateStr: string | Date): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const inputDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today.getTime() - inputDay.getTime()) / 86400000);

  const timeStr = date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase();

  if (diffDays === 0) return `Today, ${timeStr}`;
  if (diffDays === 1) return `Yesterday, ${timeStr}`;
  if (diffDays < 7) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${days[date.getDay()]}, ${timeStr}`;
  }
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
}

/**
 * Format a date as a short date string
 * e.g. "Mon, Jan 15"
 */
export function formatDate(dateStr: string | Date): string {
  const date = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
}

/**
 * Get greeting based on time of day
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Get trigger emoji and label
 */
export function getTriggerInfo(type: string) {
  const map: Record<string, { emoji: string; label: string }> = {
    rain: { emoji: '🌧', label: 'Rain' },
    flood: { emoji: '🌊', label: 'Flood' },
    heat: { emoji: '🔥', label: 'Extreme Heat' },
    aqi: { emoji: '🌫', label: 'Hazardous AQI' },
    demand: { emoji: '📉', label: 'Demand Drop' },
    traffic: { emoji: '🚗', label: 'Traffic' },
  };
  return map[type] || { emoji: '⚠', label: type };
}

/**
 * Get weather emoji based on condition
 */
export function getWeatherEmoji(condition: string): string {
  const map: Record<string, string> = {
    'Clear': '☀️',
    'Hot': '🌡️',
    'Extreme Heat': '🔥',
    'Drizzle': '🌦️',
    'Light Rain': '🌧️',
    'Moderate Rain': '🌧️',
    'Heavy Rain': '⛈️',
  };
  return map[condition] || '☁️';
}

/**
 * Get AQI color class
 */
export function getAqiColor(category: string): string {
  const map: Record<string, string> = {
    'Good': 'text-safe',
    'Satisfactory': 'text-safe',
    'Moderate': 'text-warn',
    'Poor': 'text-warn',
    'Very Poor': 'text-danger',
    'Hazardous': 'text-danger',
  };
  return map[category] || 'text-chrome';
}

/**
 * Get claim status display info
 */
export function getClaimStatusInfo(status: string) {
  const map: Record<string, { label: string; pillClass: string }> = {
    'paid': { label: 'PAID', pillClass: 'pill-safe' },
    'auto_approved': { label: 'AUTO-APPROVED', pillClass: 'pill-klein' },
    'under_review': { label: 'REVIEWING', pillClass: 'pill-warn' },
    'pending': { label: 'PENDING', pillClass: 'pill-warn' },
    'escalated': { label: 'ESCALATED', pillClass: 'pill-danger' },
    'declined': { label: 'DECLINED', pillClass: 'pill-danger' },
  };
  return map[status] || { label: status.toUpperCase(), pillClass: 'pill-warn' };
}
