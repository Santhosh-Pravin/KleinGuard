import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';

export default function AlertBanner() {
  const { alertBanner, setAlertBanner } = useAppStore();

  const bgMap = {
    warn: 'rgba(245,168,0,0.12)',
    safe: 'rgba(0,201,122,0.10)',
    danger: 'rgba(245,61,91,0.10)',
  };

  return (
    <AnimatePresence>
      {alertBanner && (
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mx-4 rounded-md overflow-hidden cursor-pointer"
          style={{ background: bgMap[alertBanner.type] || bgMap.warn }}
          onClick={() => setAlertBanner(null)}
        >
          <div className="px-4 py-3 flex items-center justify-between">
            <p className="font-jetbrains text-[11px] text-ink flex-1" style={{ lineHeight: '1.4' }}>
              {alertBanner.message}
            </p>
            <div className="w-2 h-2 rounded-full bg-signal animate-pulse-dot ml-3 flex-shrink-0" />
          </div>
          {/* Shrinking progress bar */}
          <div className="h-[2px] bg-klein/20">
            <div className="h-full bg-klein/40 animate-shrink-bar" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
