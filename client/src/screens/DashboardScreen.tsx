import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { useCountUp } from '../hooks/useCountUp';
import { formatINR, formatTime, getGreeting, getWeatherEmoji, getAqiColor, getClaimStatusInfo, getTriggerInfo } from '../lib/formatters';
import { getMe, getCurrentPolicy, getClaims, getWeather, getAqi, getTraffic, getOrders, getEarnings, forceTrigger, resetDemo } from '../lib/api';
import { useTriggerMonitor } from '../hooks/useTriggerMonitor';
import BottomNav from '../components/BottomNav';
import AlertBanner from '../components/AlertBanner';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts';

const pageTransition: any = { duration: 0.45, ease: [0.22, 1, 0.36, 1] };

export default function DashboardScreen() {
  const { user, setUser, policy, setPolicy, claims, setClaims, demoMode, addToast } = useAppStore();
  const [earnings, setEarnings] = useState<any[]>([]);
  const [localConditions, setLocalConditions] = useState<any>({});
  
  useTriggerMonitor();

  const totalWeekEarnings = earnings.reduce((sum, e) => sum + (e.amount || 0), 0);
  const earningsDisplay = useCountUp(totalWeekEarnings, 800);
  const expectedWeekly = user?.weekly_income || 12000;
  const protectedAmount = Math.max(0, expectedWeekly / 7 * 7 - totalWeekEarnings);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadConditions, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [meRes, policyRes, claimsRes] = await Promise.all([
        getMe().catch(() => null),
        getCurrentPolicy().catch(() => null),
        getClaims().catch(() => null),
      ]);
      if (meRes?.data) setUser(meRes.data);
      if (policyRes?.data) setPolicy(policyRes.data);
      if (claimsRes?.data) setClaims(claimsRes.data);
    } catch {}
    
    // Load earnings
    try {
      const earningsRes = await getEarnings();
      setEarnings(earningsRes.data || []);
    } catch {
      // Mock earnings
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      setEarnings(days.map((d, i) => ({ date: d, amount: [320, 280, 0, 350, 310, 290, 290][i], day: d })));
    }
    
    loadConditions();
  };

  const loadConditions = async () => {
    try {
      const zone = (user?.zones as string[])?.[0] || 'Adyar';
      const [w, a, t, o] = await Promise.all([
        getWeather(zone), getAqi(zone), getTraffic(zone), getOrders(zone),
      ]);
      setLocalConditions({ weather: w.data, aqi: a.data, traffic: t.data, orders: o.data });
    } catch {}
  };

  const chartData = earnings.map((e, i) => {
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return { name: e.day || dayNames[i] || `D${i+1}`, amount: e.amount || 0 };
  }).reverse();

  const greeting = getGreeting();
  const userName = user?.name || 'Mani';
  const policyStatus = policy?.status === 'active';

  const cond = localConditions;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={pageTransition}
      className="min-h-screen bg-mist pb-24"
    >
      {/* Header */}
      <div className="bg-klein px-6 pt-10 pb-6">
        <div className="flex justify-between items-start">
          <h2 className="font-syne font-bold text-[20px] text-white">
            {greeting}, {userName}
          </h2>
          <button className="text-white/60 text-xl">🔔</button>
        </div>

        {/* Status pill */}
        <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-pill"
          style={{ background: 'rgba(255,255,255,0.12)' }}>
          <div className={`w-2 h-2 rounded-full animate-pulse-dot ${policyStatus ? 'bg-signal' : 'bg-warn'}`} />
          <span className="font-jetbrains text-[11px] text-white font-medium">
            {policyStatus ? 'Coverage On' : 'No Active Policy'}
          </span>
        </div>

        {/* Stat chips */}
        <div className="flex gap-2 mt-4 mb-2">
          {[
            { label: 'WEEK', value: formatINR(totalWeekEarnings || 1840) },
            { label: 'POLICY', value: policyStatus ? 'Active' : 'None' },
            { label: 'NEXT RESET', value: `${policy?.days_until_reset || 4} days` },
          ].map((chip, i) => (
            <div key={i} className="flex-1 rounded-sm px-3 py-2" style={{ background: 'rgba(255,255,255,0.10)' }}>
              <p className="font-jetbrains text-[8px] tracking-label text-white/40">{chip.label}</p>
              <p className="font-jetbrains text-[13px] text-white font-bold mt-0.5">{chip.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Duty Controls & Mock GPS */}
      <div className="px-5 mt-4">
        <div className="card p-4 flex flex-col items-center">
          <p className="font-jetbrains text-[10px] tracking-label text-chrome mb-3">WORK DUTY STATUS</p>
          {!user?.is_working ? (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={async () => {
                try {
                  const api = await import('../lib/api');
                  const targetZone = (user?.zones as string[])?.[0] || 'Adyar';
                  const res = await api.setDuty(true, targetZone);
                  setUser(res.data);
                  addToast({ message: 'You are now online.', type: 'info' });
                } catch {
                  addToast({ message: 'Error updating duty status', type: 'error' });
                }
              }}
              className="w-full bg-klein text-white font-syne font-bold text-base py-4 rounded-xl shadow-lg border-2 border-klein hover:bg-klein/90 transition-all"
            >
              Start Working
            </motion.button>
          ) : (
            <div className="w-full">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={async () => {
                  try {
                    const api = await import('../lib/api');
                    const res = await api.setDuty(false, null);
                    setUser(res.data);
                    addToast({ message: 'You are offline.', type: 'info' });
                  } catch {}
                }}
                className="w-full bg-red-50 text-red-600 font-syne font-bold text-base py-3 rounded-xl border border-red-200 hover:bg-red-100 transition-colors mb-3"
              >
                Stop Working
              </motion.button>
              
              <div className="bg-mist p-3 rounded-lg border flex items-center gap-3" style={{ borderColor: 'rgba(0,47,167,0.06)' }}>
                <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-sm border" style={{ borderColor: 'rgba(0,47,167,0.1)' }}>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse-dot" />
                </div>
                <div>
                  <p className="font-jetbrains text-[9px] text-chrome uppercase tracking-wider">Connected to {user.platform || 'Zepto'}</p>
                  <p className="font-syne font-bold text-[13px] text-ink line-clamp-1">
                    Active Delivery in <span className="text-klein">{user.current_location}</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alert banner */}
      <div className="mt-3">
        <AlertBanner />
      </div>

      <div className="px-5 mt-4 space-y-4">
        {/* Earnings card */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, ...pageTransition }}
          className="card p-5"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="font-syne font-bold text-[14px] text-ink">This Week</span>
            <span className="font-data text-[20px] text-klein">{formatINR(earningsDisplay || 1840)}</span>
          </div>

          {/* Chart */}
          <div className="h-[140px] -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.length > 0 ? chartData : [
                { name: 'Mon', amount: 320 }, { name: 'Tue', amount: 280 },
                { name: 'Wed', amount: 0 }, { name: 'Thu', amount: 350 },
                { name: 'Fri', amount: 310 }, { name: 'Sat', amount: 290 },
                { name: 'Sun', amount: 290 },
              ]}>
                <defs>
                  <linearGradient id="kleinGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#002FA7" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#002FA7" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,47,167,0.06)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: '#8FA3D4' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: '#8FA3D4' }} axisLine={false} tickLine={false} width={30} />
                <Area type="stepAfter" dataKey="amount" stroke="#002FA7" strokeWidth={2} fill="url(#kleinGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Stats row */}
          <div className="flex justify-between mt-3 pt-3 border-t" style={{ borderColor: 'rgba(0,47,167,0.06)' }}>
            {[
              { label: 'Expected', value: formatINR(2200) },
              { label: 'Earned', value: formatINR(totalWeekEarnings || 1840) },
              { label: 'Protected', value: formatINR(Math.round(protectedAmount) || 360) },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className="font-jetbrains text-[9px] text-chrome">{s.label}</p>
                <p className="font-jetbrains text-[12px] font-bold text-ink mt-0.5">{s.value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Live conditions strip */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, ...pageTransition }}
        >
          <p className="font-jetbrains text-[10px] tracking-label text-chrome mb-2">LIVE CONDITIONS</p>
          <div className="flex gap-2.5 overflow-x-auto hide-scrollbar pb-1">
            {/* Weather */}
            <div className="card p-3 min-w-[100px] flex-shrink-0" style={{ height: '88px' }}>
              <span className="text-lg">{getWeatherEmoji(cond.weather?.condition || 'Clear')}</span>
              <p className="font-data text-[14px] text-ink mt-1">{cond.weather?.temp_c || 33}°</p>
              <p className="font-jetbrains text-[9px] text-chrome">{cond.weather?.condition || 'Clear'}</p>
              <div className={`w-1.5 h-1.5 rounded-full mt-1 ${
                cond.weather?.risk_level === 'high' || cond.weather?.risk_level === 'critical' ? 'bg-danger' :
                cond.weather?.risk_level === 'medium' ? 'bg-warn' : 'bg-safe'
              }`} />
            </div>

            {/* AQI */}
            <div className="card p-3 min-w-[100px] flex-shrink-0" style={{ height: '88px' }}>
              <p className={`font-data text-[18px] ${getAqiColor(cond.aqi?.category || 'Moderate')}`}>
                {cond.aqi?.aqi_value || 142}
              </p>
              <p className="font-jetbrains text-[9px] text-chrome mt-1">{cond.aqi?.category || 'Moderate'}</p>
              <p className="font-jetbrains text-[8px] text-chrome/60 mt-0.5">AQI</p>
            </div>

            {/* Traffic */}
            <div className="card p-3 min-w-[100px] flex-shrink-0" style={{ height: '88px' }}>
              <p className={`font-data text-[13px] font-bold ${
                cond.traffic?.level === 'HIGH' ? 'text-danger' : cond.traffic?.level === 'MED' ? 'text-warn' : 'text-safe'
              }`}>{cond.traffic?.level || 'MED'}</p>
              <div className="h-1 bg-mist rounded-full mt-2 overflow-hidden">
                <div className={`h-full rounded-full ${
                  cond.traffic?.level === 'HIGH' ? 'bg-danger' : cond.traffic?.level === 'MED' ? 'bg-warn' : 'bg-safe'
                }`} style={{ width: `${(cond.traffic?.congestion_index || 0.5) * 100}%` }} />
              </div>
              <p className="font-jetbrains text-[8px] text-chrome mt-1">~{cond.traffic?.avg_delay_mins || 14} min</p>
            </div>

            {/* Orders */}
            <div className="card p-3 min-w-[100px] flex-shrink-0" style={{ height: '88px' }}>
              <p className="font-jetbrains text-[9px] text-chrome">{(user?.zones as string[])?.[0] || 'Adyar'}</p>
              <p className={`font-data text-[16px] mt-1 ${
                (cond.orders?.drop_pct || 0) > 30 ? 'text-danger' : 'text-safe'
              }`}>
                {(cond.orders?.drop_pct || 0) > 0 ? `↓${cond.orders?.drop_pct}%` : '↑ Normal'}
              </p>
              <p className="font-jetbrains text-[8px] text-chrome mt-0.5">Orders</p>
            </div>
          </div>
        </motion.div>

        {/* Recent claims */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, ...pageTransition }}
        >
          <p className="font-jetbrains text-[10px] tracking-label text-chrome mb-3">RECENT CLAIMS</p>
          {(!claims || claims.length === 0) ? (
            <p className="font-syne text-[13px] text-chrome italic">No claims this week. Clean run.</p>
          ) : (
            <div className="space-y-2">
              {claims.slice(0, 4).map((claim) => {
                const trigger = getTriggerInfo(claim.trigger_type || '');
                const status = getClaimStatusInfo(claim.status);
                return (
                  <div key={claim.id} className="card p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{trigger.emoji}</span>
                      <div>
                        <p className="font-syne font-bold text-[13px] text-ink">{trigger.label}</p>
                        <p className="font-jetbrains text-[9px] text-chrome">
                          {claim.trigger_zone || 'Adyar'} · {formatTime(claim.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <span className="font-data text-[13px] text-ink">{formatINR(claim.payout_amount)}</span>
                      <span className={`${status.pillClass} font-jetbrains text-[9px] font-bold px-2 py-1 rounded-sm`}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Demo controls */}
      {demoMode && <DemoControls />}

      <BottomNav />
    </motion.div>
  );
}

function DemoControls() {
  const { addToast } = useAppStore();
  const triggers = [
    { type: 'rain', label: '🌧 Rain' },
    { type: 'flood', label: '🌊 Flood' },
    { type: 'heat', label: '🔥 Heat' },
    { type: 'aqi', label: '🌫 AQI' },
    { type: 'demand', label: '📉 Demand' },
  ];

  const handleTrigger = async (type: string) => {
    try {
      await forceTrigger(type, 'Adyar');
      addToast({ message: `${type} trigger fired for Adyar.`, type: 'info' });
    } catch (err) {
      addToast({ message: 'Trigger failed.', type: 'error' });
    }
  };

  const handleReset = async () => {
    try {
      await resetDemo();
      addToast({ message: 'Demo reset.', type: 'success' });
      window.location.reload();
    } catch {}
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-20 right-3 z-40 card p-3 shadow-lg"
      style={{ maxWidth: '200px' }}
    >
      <p className="font-jetbrains text-[9px] tracking-label text-chrome mb-2">DEMO CONTROLS</p>
      <div className="flex flex-wrap gap-1.5">
        {triggers.map(t => (
          <button key={t.type} onClick={() => handleTrigger(t.type)}
            className="text-[11px] px-2 py-1.5 rounded-sm bg-mist hover:bg-ice transition-colors font-jetbrains">
            {t.label}
          </button>
        ))}
      </div>
      <button onClick={handleReset} className="mt-2 w-full text-[10px] px-2 py-1.5 rounded-sm bg-danger/10 text-danger font-jetbrains font-bold">
        Reset Demo
      </button>
    </motion.div>
  );
}
