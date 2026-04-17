import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';

export default function AdminLoginScreen() {
  const { setScreen } = useAppStore();
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = () => {
    if (passcode === 'admin' || passcode === 'admin123') {
      document.documentElement.classList.add('dark');
      setScreen('admin-dashboard');
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
      setPasscode('');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ y: -30, opacity: 0 }}
      className="min-h-screen bg-ink flex flex-col items-center justify-center p-6 relative"
    >
      <button 
        onClick={() => setScreen('splash')}
        className="absolute top-6 left-6 text-white/50 text-xl font-bold p-2"
      >
         &larr;
      </button>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring' }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/5 rounded-2xl mx-auto flex items-center justify-center mb-6 border border-white/10 shadow-[0_0_20px_rgba(255,0,255,0.2)]">
            <span className="font-syne font-extrabold text-2xl text-neonPink">A</span>
          </div>
          <h1 className="font-syne font-bold text-2xl text-white mb-2 tracking-wide">Administrator Portal</h1>
          <p className="font-jetbrains text-[10px] text-chrome uppercase tracking-widest">Restricted Access Layer</p>
        </div>

        <div className="space-y-4">
          <div>
            <input
              type="password"
              placeholder="Enter Access Code"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className={`w-full bg-[#03060C] border ${error ? 'border-danger text-danger' : 'border-white/10 text-white'} rounded-xl p-4 font-jetbrains text-center tracking-widest outline-none focus:border-neonPink transition-colors`}
              autoFocus
            />
          </div>

          <AnimatePresence>
            {error && (
               <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-danger text-center font-jetbrains text-[10px] uppercase">
                 Access Denied
               </motion.p>
            )}
          </AnimatePresence>

          <button
            onClick={handleLogin}
            className="w-full py-4 mt-6 rounded-xl bg-neonPink text-white font-syne font-bold hover:bg-neonPink/80 transition-colors shadow-[0_0_15px_rgba(255,0,255,0.4)]"
          >
            Authenticate
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
