import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import BottomNav from '../components/BottomNav';

const pageTransition: any = { duration: 0.45, ease: [0.22, 1, 0.36, 1] };

export default function ProfileScreen() {
  const { user, setToken, setUser, setScreen } = useAppStore();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setScreen('splash');
  };

  const handlePhotoUpload = () => {
    // Stub for photo upload
    setPhotoUrl('https://api.dicebear.com/7.x/avataaars/svg?seed=Mani');
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -20, opacity: 0 }}
      transition={pageTransition}
      className="min-h-screen bg-mist pb-28"
    >
      <div className="bg-klein px-6 pt-12 pb-10 rounded-b-3xl relative">
        <div className="flex flex-col items-center">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border-2 border-white/20">
              {photoUrl ? (
                <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              )}
            </div>
            <button 
              onClick={handlePhotoUpload}
              className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center text-klein shadow-lg hover:scale-105 transition-transform"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </button>
          </div>
          
          <h1 className="font-syne font-bold text-[24px] text-white tracking-tight">
            {user?.name || 'Your Profile'}
          </h1>
          <p className="font-jetbrains text-[12px] text-white/50 mt-1">
            {user?.platform || 'Delivery Platform'}
          </p>
        </div>
      </div>

      <div className="px-5 -mt-4 space-y-4 relative z-10">
        {/* Account Info */}
        <div className="card p-5">
          <h3 className="font-syne font-bold text-[14px] text-ink mb-4 border-b pb-3" style={{ borderColor: 'rgba(0,47,167,0.06)' }}>
            Account Information
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-syne text-[13px] text-chrome">Phone Number</span>
              <span className="font-jetbrains font-medium text-[13px] text-ink">{user?.phone}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-syne text-[13px] text-chrome">City</span>
              <span className="font-jetbrains font-medium text-[13px] text-ink">{user?.city || 'Chennai'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-syne text-[13px] text-chrome">Active Zones</span>
              <span className="font-jetbrains font-medium text-[12px] text-ink bg-mist px-2 py-1 rounded">
                {(user?.zones || []).length} zones
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-syne text-[13px] text-chrome">Trust Score</span>
              <span className="font-jetbrains font-bold text-[13px] text-green-500">
                {((user?.trust_score || 1.0) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="card p-5">
          <h3 className="font-syne font-bold text-[14px] text-ink mb-4 border-b pb-3" style={{ borderColor: 'rgba(0,47,167,0.06)' }}>
            Settings
          </h3>
          <div className="space-y-4">
            <button className="w-full flex justify-between items-center text-left hover:opacity-70 transition-opacity">
              <span className="font-syne font-medium text-[13px] text-ink">Notification Preferences</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-chrome">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
            <button className="w-full flex justify-between items-center text-left hover:opacity-70 transition-opacity">
              <span className="font-syne font-medium text-[13px] text-ink">Payment Methods</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-chrome">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
            <button className="w-full flex justify-between items-center text-left hover:opacity-70 transition-opacity">
              <span className="font-syne font-medium text-[13px] text-ink">App Integration (Zepto/Blinkit)</span>
              <span className="font-jetbrains text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded border border-green-100 uppercase">Connected</span>
            </button>
          </div>
        </div>

        {/* Support & Logout */}
        <div className="card p-2">
          <button className="w-full text-left px-4 py-3 font-syne font-medium text-[13px] text-ink hover:bg-mist transition-colors rounded-lg flex justify-between items-center">
            Help & Support
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-chrome">
              <circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </button>
          <button onClick={handleLogout} className="w-full text-left px-4 py-3 font-syne font-bold text-[13px] text-red-500 hover:bg-red-50 transition-colors rounded-lg mt-1">
            Log Out
          </button>
        </div>
        
        <p className="text-center font-jetbrains text-[10px] text-chrome mt-6 mb-2">
          KleinGuard App v1.0.0
        </p>
      </div>

      <BottomNav />
    </motion.div>
  );
}
