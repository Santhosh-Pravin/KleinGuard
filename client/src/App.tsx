import { useEffect } from 'react';
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
import { forceTrigger } from './lib/api';

function DemoControls() {
  const { addToast } = useAppStore();

  const handleTrigger = async (type: string) => {
    try {
      await forceTrigger(type, 'Adyar');
      addToast({ type: 'success', message: `${type} trigger simulated for Adyar` });
    } catch (e) {
      console.error(e);
      addToast({ type: 'error', message: `Failed to trigger ${type}. Server may be unreachable.` });
    }
  };

  return (
    <div className="fixed right-4 lg:right-10 top-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl border border-[rgba(0,47,167,0.08)] p-5 flex-col gap-3 z-50 hidden md:flex min-w-[140px]">
      <div className="flex items-center gap-2 mb-1 justify-center">
        <h3 className="font-syne font-bold text-[13px] text-ink">Simulate</h3>
      </div>
      <p className="font-jetbrains text-[9px] text-chrome text-center mb-2 leading-tight">Click to force a<br/>disruption event</p>
      {['rain', 'flood', 'heat', 'aqi', 'demand', 'traffic'].map((t) => (
        <button
          key={t}
          onClick={() => handleTrigger(t)}
          className="px-4 py-2 bg-mist border border-[rgba(0,47,167,0.1)] rounded-xl font-jetbrains text-[12px] font-semibold hover:bg-[#EEF2FF] hover:border-[#002FA7] transition-all capitalize text-klein text-center shadow-sm"
        >
          {t}
        </button>
      ))}
    </div>
  );
}

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
      default: return <SplashScreen />;
    }
  };

  return (
    <>
      <AnimatePresence mode="wait">
        <div key={screen}>
          {renderScreen()}
        </div>
      </AnimatePresence>

      {/* Payout overlay */}
      <AnimatePresence>
        {showPayout && <PayoutScreen />}
      </AnimatePresence>

      {/* Demo Controls placed outside main container */}
      <DemoControls />

      {/* Toast notifications */}
      <ToastContainer />
    </>
  );
}

export default App;
