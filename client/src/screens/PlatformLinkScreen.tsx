import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { PLATFORMS } from '../lib/mockData';
import LoadingArc from '../components/LoadingArc';

const pageTransition = { duration: 0.45, ease: [0.22, 1, 0.36, 1] };

const LOADING_TEXTS = [
  'Connecting to platform...',
  'Fetching your earnings history...',
  'Mapping your delivery zones...',
];

export default function PlatformLinkScreen() {
  const { registrationData, updateRegistration, setScreen } = useAppStore();
  const [selectedPlatform, setSelectedPlatform] = useState(registrationData.platform || '');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setLoadingStep((s) => {
        if (s >= LOADING_TEXTS.length - 1) {
          clearInterval(interval);
          setTimeout(() => {
            updateRegistration({ platform: selectedPlatform });
            setScreen('zone-setup');
          }, 500);
          return s;
        }
        return s + 1;
      });
    }, 800);
    return () => clearInterval(interval);
  }, [isLoading, selectedPlatform, setScreen, updateRegistration]);

  const handleAuthorize = () => {
    if (!selectedPlatform) return;
    setIsLoading(true);
    setLoadingStep(0);
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -20, opacity: 0 }}
      transition={pageTransition}
      className="min-h-screen bg-mist relative"
    >
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-klein flex flex-col items-center justify-center"
          >
            <LoadingArc size={100} color="#00CFFF" />
            <AnimatePresence mode="wait">
              <motion.p
                key={loadingStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="font-jetbrains text-[12px] text-white/60 mt-8"
              >
                {LOADING_TEXTS[loadingStep]}
              </motion.p>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-klein px-6 pt-12 pb-8">
        <button onClick={() => setScreen('register')} className="font-jetbrains text-[11px] text-white/50 mb-4 block">
          Back
        </button>
        <h1 className="font-syne font-extrabold text-[26px] text-white tracking-headline">
          Link your platform
        </h1>
        <p className="font-jetbrains text-[11px] mt-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
          We read your earnings and zone data in read-only mode.
        </p>
      </div>

      <div className="px-6 pt-6 -mt-2 space-y-3">
        {PLATFORMS.map((platform, index) => (
          <motion.button
            key={platform.id}
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.08, ...pageTransition }}
            onClick={() => setSelectedPlatform(platform.name)}
            className={`card w-full text-left p-5 flex items-center gap-4 relative transition-all ${
              selectedPlatform === platform.name ? 'border-klein border-active' : ''
            }`}
          >
            <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl" style={{ background: `${platform.color}15` }}>
              {platform.emoji}
            </div>
            <div className="flex-1">
              <p className="font-syne font-bold text-[15px] text-ink">{platform.name}</p>
              <p className="font-jetbrains text-[10px] text-chrome mt-0.5">
                Connects earnings, orders, and zone history
              </p>
            </div>
            {selectedPlatform === platform.name && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-3 right-3 min-w-6 h-6 bg-klein rounded-full flex items-center justify-center px-1"
              >
                <span className="text-white text-[10px] font-jetbrains">OK</span>
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>

      <div className="px-6 mt-8">
        <button onClick={handleAuthorize} disabled={!selectedPlatform} className="btn-primary">
          Authorize Access
        </button>
      </div>
    </motion.div>
  );
}
