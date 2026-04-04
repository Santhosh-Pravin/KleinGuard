import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { useCountUp } from '../hooks/useCountUp';
import { formatINR } from '../lib/formatters';
import { COVERAGE_ITEMS } from '../lib/mockData';
import { activatePolicy } from '../lib/api';

const pageTransition = { duration: 0.45, ease: [0.22, 1, 0.36, 1] };

const FACTOR_LABELS: Record<string, string> = {
  zone_risk: 'Zone Risk Factor',
  aqi_exposure: 'AQI Exposure',
  demand_volatility: 'Demand Volatility',
  behavior_score: 'Behavior Score',
  claim_history: 'Claim History',
};

const FACTOR_TOOLTIPS: Record<string, string> = {
  zone_risk: 'Based on historical flood frequency and waterlogging patterns in your delivery zones.',
  aqi_exposure: 'Reflects average air quality index in your active areas. Higher AQI means more risk.',
  demand_volatility: 'Measures how often order volumes drop significantly in your zones.',
  behavior_score: 'Your platform reliability score. Better behavior means lower premiums.',
  claim_history: 'Based on claims filed in the last 4 weeks. Fewer claims keeps this low.',
};

export default function PolicyOfferScreen() {
  const { policyOffer, setPolicy, setScreen } = useAppStore();
  const [activating, setActivating] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [hoveredFactor, setHoveredFactor] = useState<string | null>(null);
  const [barsReady, setBarsReady] = useState(false);

  const offer = policyOffer || {
    coverage_amount: 2000, weekly_premium: 52,
    premium_factors: { base_rate: 45, zone_risk: 0.82, aqi_exposure: 0.91, demand_volatility: 0.74, behavior_score: 0.95, claim_history: 1.00 },
    risk_score: 0.71, formula_display: '₹45 × 0.82 × 0.91 × 0.74 × 0.95 × 1.00 = ₹52/wk',
    risk_tier: 'medium',
  };

  const premiumValue = useCountUp(offer.weekly_premium, 800);

  useEffect(() => {
    setTimeout(() => setBarsReady(true), 400);
  }, []);

  const handleActivate = async () => {
    setActivating(true);
    try {
      const res = await activatePolicy({
        coverage_amount: offer.coverage_amount,
        weekly_premium: offer.weekly_premium,
        factors: offer.premium_factors,
        risk_score: offer.risk_score,
      });
      setPolicy(res.data);
    } catch {
      setPolicy({
        policy_ref: 'KG-CHN-2024-001847', status: 'active',
        coverage_amount: offer.coverage_amount, weekly_premium: offer.weekly_premium,
        premium_factors: offer.premium_factors, risk_score: offer.risk_score,
      });
    }
    setShowFlash(true);
    setTimeout(() => {
      setShowFlash(false);
      setScreen('dashboard');
    }, 600);
  };

  const factors = offer.factors || offer.premium_factors || {};
  const factorEntries = Object.entries(factors).filter(([k]) => k !== 'base_rate' && k !== 'safety_compliance');

  const RISK_BADGES = [
    { label: 'WEATHER RISK', value: factors.demand_volatility?.toString() || '0.74', level: 'Medium', color: '#F5A800' },
    { label: 'ZONE SAFETY', value: factors.zone_risk?.toString() || '0.82', level: 'Good', color: '#00C97A' },
    { label: 'DEMAND RISK', value: '0.68', level: 'Low', color: '#00C97A' },
  ];

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -20, opacity: 0 }}
      transition={pageTransition}
      className="min-h-screen bg-mist pb-28"
    >
      {/* Activation flash */}
      {showFlash && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-50 bg-klein"
        />
      )}

      {/* Hero card */}
      <div className="bg-klein px-6 pt-12 pb-8">
        <p className="font-jetbrains text-[10px] tracking-label uppercase" style={{ color: 'rgba(255,255,255,0.45)' }}>
          YOUR COVERAGE
        </p>
        <h1 className="font-syne font-extrabold text-[54px] text-white tracking-headline mt-2">
          {formatINR(offer.coverage_amount)}
        </h1>
        <p className="font-jetbrains text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
          /week protected income
        </p>
      </div>

      <div className="px-5 -mt-4 space-y-4">
        {/* Premium breakdown card */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, ...pageTransition }}
          className="card p-5"
        >
          <div className="flex justify-between items-center mb-5">
            <span className="font-syne font-bold text-[13px] text-ink">Weekly Premium</span>
            <span className="font-syne font-extrabold text-[22px] text-klein">
              {formatINR(premiumValue)}
            </span>
          </div>

          {/* Factor bars */}
          <div className="space-y-3.5">
            {factorEntries.map(([key, value], i) => (
              <div 
                key={key} 
                className="relative"
                onMouseEnter={() => setHoveredFactor(key)}
                onMouseLeave={() => setHoveredFactor(null)}
              >
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-syne font-medium text-[13px] text-ink">
                    {FACTOR_LABELS[key] || key}
                  </span>
                  <span className="font-jetbrains font-bold text-[12px] text-klein">
                    {typeof value === 'number' ? value.toFixed(2) : value}
                  </span>
                </div>
                <div className="h-1 bg-mist rounded-sm overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: barsReady ? `${(Number(value) || 0) * 100}%` : 0 }}
                    transition={{ delay: i * 0.08, duration: 0.6, ease: 'easeOut' }}
                    className="h-full bg-klein rounded-sm"
                  />
                </div>
                {/* Tooltip */}
                {hoveredFactor === key && FACTOR_TOOLTIPS[key] && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute left-0 right-0 top-full mt-1 z-10 bg-ink text-white p-3 rounded-md font-jetbrains text-[10px] leading-relaxed shadow-lg"
                  >
                    {FACTOR_TOOLTIPS[key]}
                  </motion.div>
                )}
              </div>
            ))}
          </div>

          {/* Formula */}
          <div className="mt-5 pt-4 border-t" style={{ borderColor: 'rgba(0,47,167,0.08)' }}>
            <p className="font-jetbrains text-[10px] text-chrome">
              {offer.formula_display || `Base ₹45 × ${factors.zone_risk} × ${factors.aqi_exposure} × ${factors.demand_volatility} = ₹${offer.weekly_premium}/wk`}
            </p>
          </div>
        </motion.div>

        {/* Risk score badges */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, ...pageTransition }}
          className="flex gap-2.5"
        >
          {RISK_BADGES.map((badge, i) => (
            <div key={i} className="flex-1 card p-3 text-center">
              <p className="font-jetbrains text-[8px] tracking-label text-chrome">{badge.label}</p>
              <p className="font-syne font-bold text-[13px] mt-1" style={{ color: badge.color }}>{badge.level}</p>
              <p className="font-jetbrains font-bold text-[11px] text-ink mt-0.5">{badge.value}</p>
            </div>
          ))}
        </motion.div>

        {/* What's covered */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, ...pageTransition }}
          className="card p-5"
        >
          <h3 className="font-syne font-bold text-[14px] text-ink mb-4">What's covered</h3>
          <div className="space-y-2.5">
            {COVERAGE_ITEMS.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-2 h-2 bg-klein rounded-[2px]" />
                <span className="font-syne font-medium text-[13px] text-ink">{item}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white px-6 py-4 border-t" style={{ borderColor: 'rgba(0,47,167,0.08)' }}>
        <button onClick={handleActivate} disabled={activating} className="btn-primary">
          {activating ? 'Activating...' : 'Activate Coverage'}
        </button>
      </div>
    </motion.div>
  );
}
