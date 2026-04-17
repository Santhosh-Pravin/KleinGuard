import { motion } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { useCountUp } from '../hooks/useCountUp';
import { formatINR, formatTime } from '../lib/formatters';
import { useMemo } from 'react';

export default function PayoutScreen() {
  const { payoutAmount, setShowPayout, setScreen } = useAppStore();
  const displayAmount = useCountUp(payoutAmount || 0, 800);
  
  const txId = useMemo(() => 'txn_' + Math.random().toString(36).substr(2, 9).toUpperCase(), []);

  const dismiss = () => {
    setShowPayout(false);
    setScreen('dashboard');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 bg-ink/90 flex flex-col items-center justify-center cursor-pointer p-6"
      onClick={dismiss}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4, type: 'spring', bounce: 0.4 }}
        className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Success header */}
        <div className="bg-[#00C97A] text-white p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
           <motion.div 
             initial={{ scale: 0, rotate: -45 }}
             animate={{ scale: 1, rotate: 0 }}
             transition={{ delay: 0.4, type: 'spring', bounce: 0.6 }}
             className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 border border-white/30"
           >
             <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
             </svg>
           </motion.div>
           <h2 className="font-syne font-bold text-xl mb-1">Instant Payout Sent</h2>
           <p className="font-jetbrains text-[11px] opacity-90 tracking-wide uppercase">Zero-Touch Settlement</p>
        </div>

        {/* Details section */}
        <div className="p-6 bg-white">
          <div className="text-center mb-6">
            <p className="font-jetbrains text-[10px] text-chrome mb-1 uppercase tracking-wider">Amount Credited</p>
            <p className="font-data text-[42px] text-[#002FA7] leading-none tracking-tight">{formatINR(displayAmount)}</p>
          </div>

          <div className="space-y-3 mb-6 block">
            <div className="flex justify-between border-b border-mist pb-3">
              <span className="font-jetbrains text-[11px] text-chrome">To</span>
              <span className="font-jetbrains text-[11px] text-ink font-bold">Bank Acc •••• 4821</span>
            </div>
            <div className="flex justify-between border-b border-mist pb-3">
              <span className="font-jetbrains text-[11px] text-chrome">Time</span>
              <span className="font-jetbrains text-[11px] text-ink font-bold">{formatTime(new Date())}</span>
            </div>
            <div className="flex justify-between border-b border-mist pb-3">
              <span className="font-jetbrains text-[11px] text-chrome">Transaction ID</span>
              <span className="font-jetbrains text-[10px] text-ink font-mono">{txId}</span>
            </div>
          </div>

          <button 
            onClick={dismiss}
            className="w-full py-4 text-center rounded-xl bg-ink text-white font-syne font-bold hover:bg-ink/90 transition-colors shadow-lg"
          >
            Done
          </button>
        </div>
        
        {/* Mock branding */}
        <div className="bg-mist p-3 text-center flex items-center justify-center gap-1.5 text-chrome">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="font-syne text-[9px] font-bold tracking-widest uppercase">Secured by KleinGuard API</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
