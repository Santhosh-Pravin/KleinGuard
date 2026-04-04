import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { generatePolicy } from '../lib/api';

const ANALYSIS_STEPS = [
  'Zone flood classification',
  'Historical weather scoring',
  'AQI & heat exposure',
  'Demand volatility index',
  'Behavioral baseline',
];

const STATUS_TEXTS = [
  'Mapping flood zones...',
  'Scoring AQI exposure...',
  'Profiling demand patterns...',
  'Calculating your premium...',
];

const STEP_COMPLETE_TIMES = [600, 1200, 1800, 2400, 2900];

export default function RiskAnalysisScreen() {
  const { setScreen, setPolicyOffer } = useAppStore();
  const [currentStatus, setCurrentStatus] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    // Cycle through status texts
    const statusInterval = setInterval(() => {
      setCurrentStatus(s => (s + 1) % STATUS_TEXTS.length);
    }, 750);

    // Complete steps sequentially
    STEP_COMPLETE_TIMES.forEach((time, index) => {
      setTimeout(() => {
        setCompletedSteps(prev => [...prev, index]);
      }, time);
    });

    // Fetch policy data in background
    generatePolicy().then(res => {
      setPolicyOffer(res.data);
    }).catch(() => {
      // Use fallback data
      setPolicyOffer({
        policy_ref: '',
        status: 'pending',
        coverage_amount: 2000,
        weekly_premium: 52,
        premium_factors: {
          base_rate: 45, zone_risk: 0.82, aqi_exposure: 0.91,
          demand_volatility: 0.74, behavior_score: 0.95, claim_history: 1.00,
        },
        risk_score: 0.71,
        formula_display: '₹45 × 0.82 × 0.91 × 0.74 × 0.95 × 1.00 = ₹52/wk',
        risk_tier: 'medium',
        recommendation: 'Zone risk is moderate due to historical waterlogging in Adyar during Q4.',
      });
    });

    // Auto-advance after 3 seconds
    const timeout = setTimeout(() => {
      setScreen('policy-offer');
    }, 3200);

    return () => {
      clearInterval(statusInterval);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
      className="min-h-screen bg-ink flex flex-col items-center justify-center px-8"
    >
      {/* Label above radar */}
      <p className="font-jetbrains text-[10px] tracking-[0.2em] uppercase mb-10"
        style={{ color: 'rgba(255,255,255,0.4)' }}>
        ANALYSING YOUR RISK PROFILE
      </p>

      {/* Radar visualization */}
      <div className="relative w-48 h-48 mb-10">
        {/* 4 concentric rings */}
        {[1, 0.75, 0.5, 0.25].map((scale, i) => (
          <div
            key={i}
            className="absolute inset-0 rounded-full border animate-radar-ring"
            style={{
              borderColor: '#00CFFF',
              opacity: 0.15 - i * 0.03,
              transform: `scale(${scale})`,
              animationDelay: `${i * 400}ms`,
              borderWidth: '1.5px',
              top: `${(1 - scale) * 50}%`,
              left: `${(1 - scale) * 50}%`,
              width: `${scale * 100}%`,
              height: `${scale * 100}%`,
            }}
          />
        ))}
        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-signal animate-pulse-dot" />
      </div>

      {/* Dynamic status text */}
      <AnimatePresence mode="wait">
        <motion.p
          key={currentStatus}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="font-syne font-bold text-[18px] text-white mb-10 text-center"
        >
          {STATUS_TEXTS[currentStatus]}
        </motion.p>
      </AnimatePresence>

      {/* Step list */}
      <div className="space-y-3 w-full max-w-[260px]">
        {ANALYSIS_STEPS.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.3 }}
            animate={{ opacity: completedSteps.includes(i) ? 1 : 0.4 }}
            className="flex items-center gap-3"
          >
            <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              completedSteps.includes(i) ? 'bg-safe' : 'bg-white/20'
            }`} />
            <span className="font-jetbrains text-[11px] text-white/70">{step}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
