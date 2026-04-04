import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { formatINR } from '../lib/formatters';
import { getCurrentPolicy, getPremiumHistory, adjustPolicy } from '../lib/api';
import { TRIGGER_INFO } from '../lib/mockData';
import { useCountUp } from '../hooks/useCountUp';
import BottomNav from '../components/BottomNav';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts';

const pageTransition: any = { duration: 0.45, ease: [0.22, 1, 0.36, 1] };

export default function CoverageScreen() {
  const { policy, setPolicy, user, addToast } = useAppStore();
  const [premiumHistory, setPremiumHistory] = useState<any[]>([]);
  const [coverageSlider, setCoverageSlider] = useState(policy?.coverage_amount || 2000);
  const [adjustedPremium, setAdjustedPremium] = useState<any>(null);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  const premiumDisplay = useCountUp(adjustedPremium?.weekly_premium || policy?.weekly_premium || 52, 600);

  useEffect(() => {
    getCurrentPolicy().then(res => setPolicy(res.data)).catch(() => {});
    getPremiumHistory(user?.id || 1).then(res => setPremiumHistory(res.data)).catch(() => {
      setPremiumHistory([
        { week: 'W1', weekly_premium: 48 }, { week: 'W2', weekly_premium: 52 },
        { week: 'W3', weekly_premium: 50 }, { week: 'W4', weekly_premium: 55 },
        { week: 'W5', weekly_premium: 52 }, { week: 'W6', weekly_premium: 49 },
        { week: 'W7', weekly_premium: 53 }, { week: 'W8', weekly_premium: 52 },
      ]);
    });
  }, []);

  const handleCoverageChange = async (value: number) => {
    setCoverageSlider(value);
    setIsAdjusting(true);
    try {
      const res = await adjustPolicy(value);
      setAdjustedPremium(res.data);
    } catch {
      // Fallback: simple proportional calculation
      const ratio = value / 2000;
      setAdjustedPremium({ weekly_premium: Math.round(52 * ratio), formula_display: `Rs45 x factors x ${ratio.toFixed(1)} = Rs${Math.round(52 * ratio)}/wk` });
    }
    setIsAdjusting(false);
  };

  const handleCopyRef = () => {
    navigator.clipboard.writeText(policy?.policy_ref || 'KG-CHN-2024-001847');
    setCopiedRef(true);
    addToast({ message: 'Copied.', type: 'success', duration: 2000 });
    setTimeout(() => setCopiedRef(false), 2000);
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={pageTransition}
      className="min-h-screen bg-mist pb-24"
    >
      {/* Header */}
      <div className="bg-klein px-6 pt-10 pb-6">
        <h1 className="font-syne font-extrabold text-[24px] text-white tracking-headline">Coverage</h1>
      </div>

      <div className="px-5 mt-4 space-y-4 -mt-2">
        {/* Active policy card */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="card p-5"
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="font-jetbrains text-[9px] tracking-label text-chrome">ACTIVE POLICY</p>
              <p className="font-syne font-extrabold text-[28px] text-ink mt-1">
                {formatINR(coverageSlider)}
                <span className="text-[13px] text-chrome font-normal">/week</span>
              </p>
            </div>
            <div className="text-right">
              <p className="font-jetbrains text-[9px] text-chrome">Premium</p>
              <p className={`font-data text-[20px] text-klein ${isAdjusting ? 'animate-shimmer' : ''}`}>
                {formatINR(premiumDisplay)}
              </p>
            </div>
          </div>

          {/* Policy ref */}
          <button onClick={handleCopyRef}
            className="inline-flex items-center gap-2 bg-ice px-3 py-1.5 rounded-sm mb-3 hover:bg-iceDeep transition-colors">
            <span className="font-jetbrains text-[11px] tracking-mono text-klein">
              {policy?.policy_ref || 'KG-CHN-2024-001847'}
            </span>
            <span className="text-[10px] text-chrome">{copiedRef ? 'OK' : 'Copy'}</span>
          </button>

          <p className="font-jetbrains text-[10px] text-chrome">
            Renews in {policy?.days_until_reset || 4} days - premium may adjust
          </p>
        </motion.div>

        {/* Premium history chart */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, ...pageTransition }}
          className="card p-5"
        >
          <h3 className="font-syne font-bold text-[14px] text-ink mb-3">Premium History</h3>
          <div className="h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={premiumHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,47,167,0.06)" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 9, fontFamily: 'JetBrains Mono', fill: '#8FA3D4' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fontFamily: 'JetBrains Mono', fill: '#8FA3D4' }} axisLine={false} tickLine={false} width={25} />
                <Bar dataKey="weekly_premium" fill="#002FA7" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Coverage adjustment */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, ...pageTransition }}
          className="card p-5"
        >
          <h3 className="font-syne font-bold text-[14px] text-ink mb-1">Adjust Coverage</h3>
          <p className="font-jetbrains text-[10px] text-chrome mb-4">
            Premium recalculates live.
          </p>

          <div className="text-center mb-3">
            <span className={`font-syne font-extrabold text-[32px] text-klein ${isAdjusting ? 'animate-shimmer' : ''}`}>
              {formatINR(coverageSlider)}
            </span>
            <span className="font-jetbrains text-[11px] text-chrome">/week</span>
          </div>

          <input
            type="range"
            min={2000}
            max={5000}
            step={250}
            value={coverageSlider}
            onChange={(e) => handleCoverageChange(Number(e.target.value))}
            className="w-full accent-klein h-1.5"
          />
          <div className="flex justify-between font-jetbrains text-[9px] text-chrome mt-1">
            <span>Rs 2,000</span><span>Rs 5,000</span>
          </div>

          {/* Live formula */}
          {adjustedPremium?.formula_display && (
            <p className="font-jetbrains text-[10px] text-chrome mt-3 text-center">
              {adjustedPremium.formula_display}
            </p>
          )}
        </motion.div>

        {/* Trigger cards */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, ...pageTransition }}
        >
          <h3 className="font-syne font-bold text-[14px] text-ink mb-3">What triggers your coverage</h3>
          <div className="grid grid-cols-2 gap-2.5">
            {TRIGGER_INFO.map(trigger => (
              <div key={trigger.type} className="card p-4">
                <span className="text-xl">{trigger.emoji}</span>
                <p className="font-syne font-bold text-[12px] text-ink mt-2">{trigger.label}</p>
                <p className="font-jetbrains text-[9px] text-chrome mt-1">{trigger.threshold}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <BottomNav />
    </motion.div>
  );
}
