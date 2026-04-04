import { motion } from 'framer-motion';
import { useAppStore } from '../store/appStore';

export default function SplashScreen() {
  const { setScreen } = useAppStore();

  const handleGetProtected = () => {
    setScreen('register');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ y: -30, opacity: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen bg-klein flex flex-col items-center justify-center relative overflow-hidden"
    >
      {/* Decorative circles */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[15%] left-[10%] w-[300px] h-[300px] rounded-full border" 
          style={{ borderColor: 'rgba(255,255,255,0.04)', borderWidth: '1.5px' }} />
        <div className="absolute top-[30%] right-[5%] w-[200px] h-[200px] rounded-full border" 
          style={{ borderColor: 'rgba(255,255,255,0.03)', borderWidth: '1.5px' }} />
        <div className="absolute bottom-[20%] left-[20%] w-[400px] h-[400px] rounded-full border" 
          style={{ borderColor: 'rgba(255,255,255,0.025)', borderWidth: '1.5px' }} />
      </div>

      {/* Logo */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center z-10"
      >
        {/* KG Logomark — two overlapping rectangles forming a shield */}
        <div className="relative w-20 h-24 mb-8">
          <div className="absolute top-0 left-1 w-14 h-18 rounded-lg border-2 border-white/30 bg-white/5"
            style={{ transform: 'rotate(-6deg)' }} />
          <div className="absolute top-1 left-3 w-14 h-18 rounded-lg border-2 border-white/50 bg-white/10"
            style={{ transform: 'rotate(6deg)' }} />
          <span className="absolute inset-0 flex items-center justify-center font-syne font-extrabold text-3xl text-white tracking-tight">
            KG
          </span>
        </div>

        {/* Brand name */}
        <h1 className="font-syne font-extrabold text-[32px] text-white tracking-headline mb-3">
          KleinGuard
        </h1>

        {/* Tagline */}
        <p className="font-jetbrains text-[11px] tracking-wide uppercase" style={{ color: 'rgba(255,255,255,0.4)' }}>
          INCOME PROTECTION · GIG WORKERS
        </p>
      </motion.div>

      <div className="flex flex-col gap-3 mt-16 z-10 w-full max-w-[280px]">
        <motion.button
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          whileTap={{ scale: 0.96 }}
          onClick={handleGetProtected}
          className="bg-white text-klein font-syne font-bold text-base px-10 py-4 rounded-pill hover:shadow-lg transition-shadow w-full"
        >
          Get Protected
        </motion.button>
        <motion.button
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setScreen('sign-in')}
          className="bg-transparent border border-white/20 text-white font-syne font-medium text-base px-10 py-4 rounded-pill hover:bg-white/5 transition-colors w-full"
        >
          Sign In
        </motion.button>
      </div>

      {/* Legal line */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute bottom-8 font-jetbrains text-[9px]"
        style={{ color: 'rgba(255,255,255,0.25)' }}
      >
        Powered by parametric AI · Not traditional insurance
      </motion.p>
    </motion.div>
  );
}
