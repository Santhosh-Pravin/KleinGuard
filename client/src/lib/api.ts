import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// JWT interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kg_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const sendOtp = (phone: string) => api.post('/auth/otp/send', { phone });
export const verifyOtp = (phone: string, otp: string) => api.post('/auth/otp/verify', { phone, otp });
export const register = (data: any) => api.post('/auth/register', data);
export const getMe = () => api.get('/auth/me');
export const updateProfile = (data: any) => api.put('/auth/update', data);
export const setDuty = (is_working: boolean, current_location: string | null) => api.post('/auth/duty', { is_working, current_location });

// Policy
export const generatePolicy = (data?: any) => api.post('/policy/generate', data || {});
export const activatePolicy = (data: any) => api.post('/policy/activate', data);
export const getCurrentPolicy = () => api.get('/policy/current');
export const getPolicyHistory = () => api.get('/policy/history');
export const adjustPolicy = (coverage_amount: number) => api.put('/policy/adjust', { coverage_amount });

// Premium
export const calculatePremium = (data: any) => api.post('/premium/calculate', data);
export const getPremiumFactors = (userId: number) => api.get(`/premium/factors/${userId}`);
export const getPremiumHistory = (userId: number) => api.get(`/premium/history/${userId}`);

// Claims
export const getClaims = () => api.get('/claims');
export const getClaimDetail = (id: number) => api.get(`/claims/${id}`);
export const getClaimStats = () => api.get('/claims/stats');
export const payoutClaim = (id: number) => api.put(`/claims/${id}/payout`);
export const resetClaims = () => api.post('/claims/reset');

// Triggers
export const getActiveTriggers = () => api.get('/triggers/active');
export const getZoneTriggers = (zone: string) => api.get(`/triggers/zone/${zone}`);

// Mock APIs
export const getWeather = (zone?: string) => api.get('/mock/weather', { params: { zone } });
export const getAqi = (zone?: string) => api.get('/mock/aqi', { params: { zone } });
export const getTraffic = (zone?: string) => api.get('/mock/traffic', { params: { zone } });
export const getOrders = (zone?: string) => api.get('/mock/platform/orders', { params: { zone } });

// Force triggers (demo)
export const forceTrigger = (type: string, zone: string = 'Adyar') => 
  api.post(`/mock/force-trigger/${type}`, { zone });

// Demo
export const resetDemo = () => api.post('/demo/reset');

// Earnings
export const getEarnings = () => api.get('/earnings');

export default api;
