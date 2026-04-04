import { create } from 'zustand';

export type Screen = 
  | 'splash' | 'register' | 'sign-in' | 'platform-link' | 'zone-setup' 
  | 'risk-analysis' | 'policy-offer' | 'dashboard' 
  | 'claims' | 'coverage' | 'payout' | 'profile';

export interface User {
  id?: number;
  name: string;
  phone: string;
  city: string;
  platform: string;
  weekly_income: number;
  working_hours_start: number;
  working_hours_end: number;
  zones: string[];
  work_days: number;
  trust_score: number;
  is_working?: boolean;
  current_location?: string | null;
}

export interface PolicyFactors {
  base_rate: number;
  zone_risk: number;
  aqi_exposure: number;
  demand_volatility: number;
  behavior_score: number;
  claim_history: number;
  safety_compliance?: number;
}

export interface Policy {
  id?: number;
  policy_ref: string;
  status: string;
  coverage_amount: number;
  weekly_premium: number;
  premium_factors: PolicyFactors;
  risk_score: number;
  week_start?: string;
  week_end?: string;
  days_until_reset?: number;
  formula_display?: string;
  risk_tier?: string;
  recommendation?: string;
}

export interface Trigger {
  id: number;
  type: string;
  zone: string;
  severity: string;
  raw_value: number;
  threshold: number;
  triggered_at: string;
  is_active: boolean;
}

export interface Claim {
  id: number;
  user_id: number;
  policy_id: number;
  trigger_id: number;
  status: string;
  expected_income: number;
  actual_income: number;
  payout_amount: number;
  fraud_score: number;
  trigger_type?: string;
  trigger_zone?: string;
  severity?: string;
  signal_summary: Record<string, any>;
  created_at: string;
  resolved_at?: string;
}

export interface Conditions {
  weather?: { zone: string; rainfall_mm: number; temp_c: number; condition: string; risk_level: string; };
  aqi?: { zone: string; aqi_value: number; category: string; pm25: number; };
  traffic?: { zone: string; congestion_index: number; avg_delay_mins: number; level: string; };
  orders?: { zone: string; current_orders: number; baseline_orders: number; drop_pct: number; };
}

export interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}

interface AppState {
  // Auth
  token: string | null;
  user: User | null;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;

  // Navigation
  screen: Screen;
  setScreen: (screen: Screen) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Registration flow
  registrationData: Partial<User>;
  updateRegistration: (data: Partial<User>) => void;

  // Policy
  policy: Policy | null;
  policyOffer: Policy | null;
  setPolicy: (policy: Policy | null) => void;
  setPolicyOffer: (offer: Policy | null) => void;

  // Claims
  claims: Claim[];
  activeClaim: Claim | null;
  setClaims: (claims: Claim[]) => void;
  setActiveClaim: (claim: Claim | null) => void;
  addClaim: (claim: Claim) => void;
  updateClaim: (id: number, updates: Partial<Claim>) => void;

  // Triggers & Conditions
  triggers: Trigger[];
  conditions: Record<string, Conditions>;
  setTriggers: (triggers: Trigger[]) => void;
  addTrigger: (trigger: Trigger) => void;
  setConditions: (conditions: Record<string, Conditions>) => void;

  // UI
  demoMode: boolean;
  setDemoMode: (demo: boolean) => void;
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  showPayout: boolean;
  payoutAmount: number;
  setShowPayout: (show: boolean, amount?: number) => void;

  // Alert banner
  alertBanner: { message: string; type: 'warn' | 'safe' | 'danger' } | null;
  setAlertBanner: (alert: { message: string; type: 'warn' | 'safe' | 'danger' } | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Auth
  token: localStorage.getItem('kg_token'),
  user: null,
  setToken: (token) => {
    if (token) localStorage.setItem('kg_token', token);
    else localStorage.removeItem('kg_token');
    set({ token });
  },
  setUser: (user) => set({ user }),

  // Navigation
  screen: 'splash',
  setScreen: (screen) => set({ screen }),
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Registration
  registrationData: {
    name: '', phone: '', city: 'Chennai', platform: 'Zepto',
    weekly_income: 12000, working_hours_start: 9, working_hours_end: 21,
    zones: [], work_days: 6,
  },
  updateRegistration: (data) => set((s) => ({ registrationData: { ...s.registrationData, ...data } })),

  // Policy
  policy: null,
  policyOffer: null,
  setPolicy: (policy) => set({ policy }),
  setPolicyOffer: (policyOffer) => set({ policyOffer }),

  // Claims
  claims: [],
  activeClaim: null,
  setClaims: (claims) => set({ claims }),
  setActiveClaim: (activeClaim) => set({ activeClaim }),
  addClaim: (claim) => set((s) => ({ claims: [claim, ...s.claims] })),
  updateClaim: (id, updates) => set((s) => ({
    claims: s.claims.map(c => c.id === id ? { ...c, ...updates } : c),
    activeClaim: s.activeClaim?.id === id ? { ...s.activeClaim, ...updates } : s.activeClaim,
  })),

  // Triggers & Conditions
  triggers: [],
  conditions: {},
  setTriggers: (triggers) => set({ triggers }),
  addTrigger: (trigger) => set((s) => ({ triggers: [trigger, ...s.triggers] })),
  setConditions: (conditions) => set({ conditions }),

  // UI
  demoMode: false,
  setDemoMode: (demoMode) => set({ demoMode }),
  toasts: [],
  addToast: (toast) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) }));
    }, toast.duration || 5000);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) })),
  showPayout: false,
  payoutAmount: 0,
  setShowPayout: (show, amount = 0) => set({ showPayout: show, payoutAmount: amount }),

  // Alert banner
  alertBanner: null,
  setAlertBanner: (alertBanner) => set({ alertBanner }),
}));
