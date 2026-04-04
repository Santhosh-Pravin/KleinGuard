import { motion } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import type { Screen } from '../store/appStore';

const tabs = [
  { id: 'dashboard' as const, label: 'Home', icon: '⌂', screen: 'dashboard' as Screen },
  { id: 'coverage' as const, label: 'Coverage', icon: '🛡', screen: 'coverage' as Screen },
  { id: 'claims' as const, label: 'Claims', icon: '📋', screen: 'claims' as Screen },
  { id: 'profile' as const, label: 'Profile', icon: '👤', screen: 'profile' as Screen },
];

export default function BottomNav() {
  const { activeTab, setActiveTab, setScreen } = useAppStore();

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t" style={{ borderColor: 'rgba(0,47,167,0.1)' }}>
      <div className="flex items-center justify-around py-2 px-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setScreen(tab.screen);
            }}
            className="flex flex-col items-center gap-1 py-1 px-3 relative"
          >
            <span className={`text-lg ${activeTab === tab.id ? '' : 'opacity-50'}`}
              style={{ color: activeTab === tab.id ? '#002FA7' : '#8FA3D4' }}>
              {tab.icon}
            </span>
            <span className={`font-jetbrains text-[10px] font-medium ${activeTab === tab.id ? 'text-klein' : 'text-chrome'}`}>
              {tab.label}
            </span>
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute -bottom-2 w-6 h-0.5 bg-klein rounded-full"
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
