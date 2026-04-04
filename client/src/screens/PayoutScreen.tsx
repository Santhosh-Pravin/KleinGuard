import { motion } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { useCountUp } from '../hooks/useCountUp';
import { formatINR, formatTime } from '../lib/formatters';

export default function PayoutScreen() {
  const { payoutAmount, setShowPayout, setScreen } = useAppStore();
  const displayAmount = useCountUp(payoutAmount, 800);

  const dismiss = () => {
    setShowPayout(false);
    setScreen('dashboard');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 bg-ink flex flex-col items-center justify-center cursor-pointer"
      onClick={dismiss}
    >
      {/* Expanding line behind number */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="h-[1px] bg-white animate-line-expand mx-auto" />
      </div>

      {/* Payout amount */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="text-center relative z-10"
      >
        <p className="font-syne font-extrabold text-[72px] text-white tracking-tight leading-none">
          {formatINR(displayAmount)}
        </p>
        <p className="font-jetbrains text-[12px] text-chrome mt-4">
          Credited · {formatTime(new Date())} · UPI ···4821
        </p>
      </motion.div>
    </motion.div>
  );
}
