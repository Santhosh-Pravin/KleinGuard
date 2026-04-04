import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';

export default function ToastContainer() {
  const { toasts, removeToast } = useAppStore();

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 w-full max-w-[400px] z-50 flex flex-col gap-2 px-4">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ y: -20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => removeToast(toast.id)}
            className="card px-4 py-3 cursor-pointer flex items-center gap-3"
            style={{
              background: toast.type === 'success' ? 'rgba(0,201,122,0.08)' :
                toast.type === 'warning' ? 'rgba(245,168,0,0.08)' :
                toast.type === 'error' ? 'rgba(245,61,91,0.08)' : 'white',
            }}
          >
            <span className="text-sm">
              {toast.type === 'success' ? '✓' : toast.type === 'warning' ? '⚠' : toast.type === 'error' ? '✕' : 'ℹ'}
            </span>
            <p className="font-jetbrains text-[11px] text-ink flex-1" style={{ lineHeight: '1.4' }}>
              {toast.message}
            </p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
