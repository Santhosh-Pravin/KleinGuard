import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAppStore } from './store/appStore';
import ToastContainer from './components/Toast';
import SplashScreen from './screens/SplashScreen';
import RegistrationScreen from './screens/RegistrationScreen';
import SignInScreen from './screens/SignInScreen';
import PlatformLinkScreen from './screens/PlatformLinkScreen';
import ZoneSetupScreen from './screens/ZoneSetupScreen';
import RiskAnalysisScreen from './screens/RiskAnalysisScreen';
import PolicyOfferScreen from './screens/PolicyOfferScreen';
import DashboardScreen from './screens/DashboardScreen';
import ClaimsScreen from './screens/ClaimsScreen';
import CoverageScreen from './screens/CoverageScreen';
import ProfileScreen from './screens/ProfileScreen';
import PayoutScreen from './screens/PayoutScreen';
import AdminDashboardScreen from './screens/AdminDashboardScreen';
import AdminLoginScreen from './screens/AdminLoginScreen';

function App() {
  const { screen, setScreen, setDemoMode, showPayout, token, setToken, setUser } = useAppStore();

  // Check for demo mode from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') === 'true') {
      setDemoMode(true);
      // Set demo mode env for server
      document.title = 'KleinGuard — Demo Mode';
    }
  }, []);

  // Auto-login if token exists
  useEffect(() => {
    if (token) {
      import('./lib/api').then(({ getMe }) => {
        getMe().then(res => {
          setUser(res.data);
          setScreen('dashboard');
        }).catch(() => {
          // Token expired — stay on splash
          setToken(null);
        });
      });
    }
  }, []);

  const renderScreen = () => {
    switch (screen) {
      case 'splash': return <SplashScreen />;
      case 'register': return <RegistrationScreen />;
      case 'sign-in': return <SignInScreen />;
      case 'platform-link': return <PlatformLinkScreen />;
      case 'zone-setup': return <ZoneSetupScreen />;
      case 'risk-analysis': return <RiskAnalysisScreen />;
      case 'policy-offer': return <PolicyOfferScreen />;
      case 'dashboard': return <DashboardScreen />;
      case 'claims': return <ClaimsScreen />;
      case 'coverage': return <CoverageScreen />;
      case 'profile': return <ProfileScreen />;
      case 'admin-login': return <AdminLoginScreen />;
      case 'admin-dashboard': return <AdminDashboardScreen />;
      default: return <SplashScreen />;
    }
  };

  return (
    <>
      <DesktopEdgeTriggers />
      
      <AnimatePresence mode="wait">
        <div key={screen}>
          {renderScreen()}
        </div>
      </AnimatePresence>

      {/* Payout overlay */}
      <AnimatePresence>
        {showPayout && <PayoutScreen />}
      </AnimatePresence>

      {/* Toast notifications */}
      <ToastContainer />
    </>
  );
}

function DesktopEdgeTriggers() {
  const { user, setShowPayout } = useAppStore();
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  const [isOpen, setIsOpen] = useState(false);
  const [triggerType, setTriggerType] = useState('rain');
  const [severity, setSeverity] = useState('high');
  const [isInstant, setIsInstant] = useState(false);
  
  const triggers = [
    { type: 'rain', icon: '⛈️', label: 'Rain' },
    { type: 'aqi', icon: '🌫️', label: 'AQI' },
    { type: 'flood', icon: '🌊', label: 'Flood' },
    { type: 'demand', icon: '📉', label: 'Demand Drop' },
  ];

  const handleTrigger = async () => {
    setIsOpen(false);
    
    // For the demo: immediately force the payout UI to display if instant mode is selected
    if (isInstant) {
      setTimeout(() => {
        setShowPayout(true, severity === 'critical' ? 420 : 250);
      }, 2500);
    }

    try {
      const activeZone = user?.current_location || 'Adyar';
      await fetch(`http://localhost:3001/api/mock/force-trigger/${triggerType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zone: activeZone, severity, instant: isInstant })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const toggleDark = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
    setIsDark(!isDark);
  };

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 flex-col gap-4 hidden md:flex z-50">
      
      <button 
        onClick={toggleDark}
        title="Toggle Dark Mode"
        className="w-14 h-14 bg-ink text-white rounded-full shadow-neon border border-neonPink flex flex-col items-center justify-center hover:scale-110 transition-all active:scale-95 mb-4"
      >
        <span className="text-xl">{isDark ? '☀️' : '🌙'}</span>
      </button>

      <div className="relative">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          title="Open Trigger Menu"
          className="w-14 h-14 bg-white dark:bg-ink text-klein dark:text-white rounded-full shadow-lg border border-mist dark:border-white/10 flex flex-col items-center justify-center hover:scale-110 transition-all active:scale-95"
        >
          <span className="text-2xl">⚡</span>
        </button>

        {isOpen && (
          <div className="absolute right-16 top-0 w-64 bg-white dark:bg-[#060B14] p-4 rounded-xl shadow-2xl border border-mist dark:border-white/10 flex flex-col gap-3">
            <h3 className="font-syne font-bold text-ink dark:text-white text-sm">Trigger Menu</h3>
            
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-jetbrains text-chrome uppercase">Type</label>
              <select value={triggerType} onChange={e => setTriggerType(e.target.value)} className="bg-mist dark:bg-ink border dark:border-white/10 rounded p-2 font-syne text-sm text-ink dark:text-white outline-none">
                {triggers.map(t => <option key={t.type} value={t.type}>{t.icon} {t.label}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-jetbrains text-chrome uppercase">Severity</label>
              <select value={severity} onChange={e => setSeverity(e.target.value)} className="bg-mist dark:bg-ink border dark:border-white/10 rounded p-2 font-syne text-sm text-ink dark:text-white outline-none">
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer mt-1">
              <input type="checkbox" checked={isInstant} onChange={e => setIsInstant(e.target.checked)} className="rounded text-klein focus:ring-0" />
              <span className="font-jetbrains text-[11px] text-ink dark:text-white">Instant Payout Request</span>
            </label>

            <button onClick={handleTrigger} className="mt-2 w-full py-2 bg-klein text-white font-syne font-bold rounded-lg shadow hover:bg-kleinMid transition-colors">
              Deploy Trigger
            </button>
          </div>
        )}
      </div>

    </div>
  );
}

export default App;
