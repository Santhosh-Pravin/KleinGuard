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

      {/* Toast notifications */}
      <ToastContainer />
    </>
  );
}

export default App;
