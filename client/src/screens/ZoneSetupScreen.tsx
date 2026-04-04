import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { CITY_ZONES, WORK_DAYS_OPTIONS } from '../lib/mockData';
import { register } from '../lib/api';

const pageTransition: any = { duration: 0.45, ease: [0.22, 1, 0.36, 1] };

export default function ZoneSetupScreen() {
  const { registrationData, updateRegistration, setScreen, setToken } = useAppStore();
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const city = registrationData.city || 'Chennai';
  const zones = CITY_ZONES[city] || CITY_ZONES.Chennai;
  const selectedZones = registrationData.zones || [];

  const toggleZone = (zone: string) => {
    const current = [...selectedZones];
    const idx = current.indexOf(zone);
    if (idx >= 0) current.splice(idx, 1);
    else current.push(zone);
    updateRegistration({ zones: current });
  };

  const handleContinue = async () => {
    if (selectedZones.length === 0 || !registrationData.work_days) return;

    setLoading(true);
    try {
      const res = await register({
        name: registrationData.name,
        phone: `+91${registrationData.phone?.replace(/\s/g, '')}`,
        city: registrationData.city,
        platform: registrationData.platform,
        weekly_income: registrationData.weekly_income,
        working_hours_start: registrationData.working_hours_start,
        working_hours_end: registrationData.working_hours_end,
        zones: selectedZones,
        work_days: registrationData.work_days,
      });
      setToken(res.data.token);
      setScreen('risk-analysis');
    } catch (err) {
      console.error('Registration failed:', err);
      setScreen('risk-analysis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -20, opacity: 0 }}
      transition={pageTransition}
      className="min-h-screen bg-mist pb-28"
    >
      <div className="bg-klein px-6 pt-12 pb-8">
        <div className="flex gap-2 mb-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`h-1.5 rounded-full ${i <= 1 ? 'w-8 bg-white' : 'w-4 bg-white/20'}`} />
          ))}
        </div>
        <button onClick={() => setScreen('platform-link')} className="font-jetbrains text-[11px] text-white/50 mb-4 block">
          Back
        </button>
        <h1 className="font-syne font-extrabold text-[26px] text-white tracking-headline">
          Your zones and schedule
        </h1>
        <p className="font-jetbrains text-[11px] mt-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
          This helps us calculate your zone-level risk score.
        </p>
      </div>

      <div className="px-6 pt-6 space-y-6 -mt-2">
        <div className="card p-5">
          <h3 className="font-syne font-bold text-[14px] text-ink mb-1">Working zones</h3>
          <p className="font-jetbrains text-[10px] text-chrome mb-4">Select all zones you deliver in</p>
          <div className="flex flex-wrap gap-2">
            {zones.map((zone) => (
              <button
                key={zone}
                onClick={() => toggleZone(zone)}
                className={`px-4 py-2 rounded-pill font-jetbrains text-[11px] font-medium transition-all ${
                  selectedZones.includes(zone)
                    ? 'bg-klein text-white border-klein border-active'
                    : 'bg-mist text-ink border border-[rgba(0,47,167,0.15)] hover:border-[rgba(0,47,167,0.30)]'
                }`}
              >
                {zone}
              </button>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-syne font-bold text-[14px] text-ink mb-1">Work pattern</h3>
          <p className="font-jetbrains text-[10px] text-chrome mb-4">How many days per week do you typically work?</p>
          <div className="flex gap-2">
            {WORK_DAYS_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => updateRegistration({ work_days: d })}
                className={`flex-1 py-3 rounded-md font-jetbrains text-[14px] font-bold transition-all ${
                  registrationData.work_days === d
                    ? 'bg-klein text-white'
                    : 'bg-mist text-ink border border-[rgba(0,47,167,0.15)]'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-syne font-bold text-[14px] text-ink mb-1">Emergency contact</h3>
          <p className="font-jetbrains text-[10px] text-chrome mb-4">Optional. For your safety during disruptions.</p>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Contact name"
              value={emergencyName}
              onChange={(e) => setEmergencyName(e.target.value)}
              className="input-field"
            />
            <input
              type="tel"
              placeholder="Phone number"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
              className="input-field"
            />
          </div>
        </div>
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 mx-auto w-full max-w-[430px] bg-white px-6 py-4 border-t"
        style={{ borderColor: 'rgba(0,47,167,0.08)' }}
      >
        <button
          onClick={handleContinue}
          disabled={selectedZones.length === 0 || !registrationData.work_days || loading}
          className="btn-primary"
        >
          {loading ? 'Creating account...' : 'Continue'}
        </button>
      </div>
    </motion.div>
  );
}
