import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { CITIES, PLATFORMS } from '../lib/mockData';
import { formatINR } from '../lib/formatters';
import { sendOtp, verifyOtp } from '../lib/api';

const pageTransition = { duration: 0.45, ease: [0.22, 1, 0.36, 1] };

export default function RegistrationScreen() {
  const { registrationData, updateRegistration, setScreen } = useAppStore();
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Phone formatting
  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 10);
    if (digits.length > 5) return `${digits.slice(0, 5)} ${digits.slice(5)}`;
    return digits;
  };

  // OTP countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendOtp = async () => {
    const phone = registrationData.phone?.replace(/\s/g, '') || '';
    if (phone.length !== 10) {
      setErrors({ ...errors, phone: 'Enter a valid 10-digit number' });
      return;
    }
    setErrors({ ...errors, phone: '' });
    try {
      await sendOtp(`+91${phone}`);
      setOtpSent(true);
      setCountdown(30);
    } catch {
      setOtpSent(true);
      setCountdown(30);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpValues];
    newOtp[index] = value.slice(-1);
    setOtpValues(newOtp);

    // Auto-advance
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Check if complete
    const fullOtp = newOtp.join('');
    if (fullOtp.length === 6) {
      verifyOtp(`+91${registrationData.phone?.replace(/\s/g, '')}`, fullOtp).then((res) => {
        if (res.data.valid) {
          setOtpVerified(true);
          setErrors({ ...errors, otp: '' });
        }
      }).catch(() => {
        setErrors({ ...errors, otp: 'Invalid OTP. Try 123456.' });
      });
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleContinue = () => {
    const newErrors: Record<string, string> = {};
    if (!registrationData.name?.trim()) newErrors.name = 'Name is required';
    if (!registrationData.phone?.replace(/\s/g, '') || registrationData.phone.replace(/\s/g, '').length !== 10) 
      newErrors.phone = 'Valid phone number required';
    if (!otpVerified) newErrors.otp = 'Verify your OTP';
    if (!registrationData.city) newErrors.city = 'Select a city';
    if (!registrationData.platform) newErrors.platform = 'Select a platform';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setScreen('platform-link');
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -20, opacity: 0 }}
      transition={pageTransition}
      className="min-h-screen flex flex-col"
    >
      {/* Header */}
      <div className="bg-klein px-6 pt-12 pb-8" style={{ minHeight: '28vh' }}>
        {/* Progress dots */}
        <div className="flex gap-2 mb-6">
          {[0, 1, 2].map(i => (
            <div key={i} className={`h-1.5 rounded-full ${i === 0 ? 'w-8 bg-white' : 'w-4 bg-white/20'}`} />
          ))}
        </div>
        <button onClick={() => setScreen('splash')} className="font-jetbrains text-[11px] text-white/50 mb-4 block">
          ← Back
        </button>
        <h1 className="font-syne font-extrabold text-[28px] text-white tracking-headline">
          Create your account
        </h1>
        <p className="font-jetbrains text-[11px] mt-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Takes about 2 minutes.
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 bg-white rounded-t-xl -mt-3 px-6 pt-8 pb-28 space-y-5">
        {/* Full name */}
        <div>
          <label className="font-jetbrains text-[10px] tracking-label text-chrome block mb-2">FULL NAME</label>
          <input
            type="text"
            value={registrationData.name || ''}
            onChange={(e) => updateRegistration({ name: e.target.value })}
            placeholder="Mani Kumar"
            className={`input-field ${errors.name ? 'border-danger' : ''}`}
          />
          <AnimatePresence>
            {errors.name && (
              <motion.p initial={{ y: -5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -5, opacity: 0 }}
                className="text-danger font-jetbrains text-[10px] mt-1">{errors.name}</motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Phone number */}
        <div>
          <label className="font-jetbrains text-[10px] tracking-label text-chrome block mb-2">PHONE NUMBER</label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-jetbrains text-[13px] text-klein font-semibold bg-ice px-2 py-1 rounded-sm">+91</span>
              <input
                type="tel"
                value={formatPhone(registrationData.phone || '')}
                onChange={(e) => updateRegistration({ phone: e.target.value.replace(/\s/g, '') })}
                placeholder="98765 43210"
                className={`input-field pl-[72px] ${errors.phone ? 'border-danger' : ''}`}
              />
            </div>
            {!otpVerified && (
              <button
                onClick={handleSendOtp}
                disabled={countdown > 0}
                className="btn-secondary whitespace-nowrap"
              >
                {countdown > 0 ? (
                  <span className="font-jetbrains">{countdown}s</span>
                ) : otpSent ? 'Resend' : 'Send OTP'}
              </button>
            )}
          </div>
          <AnimatePresence>
            {errors.phone && (
              <motion.p initial={{ y: -5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -5, opacity: 0 }}
                className="text-danger font-jetbrains text-[10px] mt-1">{errors.phone}</motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* OTP Input */}
        <AnimatePresence>
          {otpSent && !otpVerified && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <label className="font-jetbrains text-[10px] tracking-label text-chrome block mb-2">ENTER OTP</label>
              <div className="flex gap-2 justify-center">
                {otpValues.map((val, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={val}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-[44px] h-[52px] text-center font-jetbrains text-xl font-bold input-field px-0"
                  />
                ))}
              </div>
              {errors.otp && <p className="text-danger font-jetbrains text-[10px] mt-2 text-center">{errors.otp}</p>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* OTP Verified checkmark */}
        <AnimatePresence>
          {otpVerified && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-2 bg-safe/10 text-safe font-jetbrains text-[11px] px-4 py-2.5 rounded-md"
            >
              <span className="text-lg">✓</span>
              Phone verified
            </motion.div>
          )}
        </AnimatePresence>

        {/* City dropdown */}
        <div>
          <label className="font-jetbrains text-[10px] tracking-label text-chrome block mb-2">CITY</label>
          <select
            value={registrationData.city || 'Chennai'}
            onChange={(e) => updateRegistration({ city: e.target.value, zones: [] })}
            className={`input-field appearance-none ${errors.city ? 'border-danger' : ''}`}
          >
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Platform */}
        <div>
          <label className="font-jetbrains text-[10px] tracking-label text-chrome block mb-2">PLATFORM</label>
          <select
            value={registrationData.platform || 'Zepto'}
            onChange={(e) => updateRegistration({ platform: e.target.value })}
            className={`input-field appearance-none ${errors.platform ? 'border-danger' : ''}`}
          >
            {PLATFORMS.map(p => <option key={p.id} value={p.name}>{p.emoji} {p.name}</option>)}
          </select>
        </div>

        {/* Weekly income slider */}
        <div>
          <label className="font-jetbrains text-[10px] tracking-label text-chrome block mb-1">WEEKLY INCOME ESTIMATE</label>
          <div className="font-data text-xl text-klein mb-2">{formatINR(registrationData.weekly_income || 12000)}</div>
          <input
            type="range"
            min={5000}
            max={40000}
            step={500}
            value={registrationData.weekly_income || 12000}
            onChange={(e) => updateRegistration({ weekly_income: Number(e.target.value) })}
            className="w-full accent-klein h-1.5"
          />
          <div className="flex justify-between font-jetbrains text-[9px] text-chrome mt-1">
            <span>₹5,000</span><span>₹40,000</span>
          </div>
        </div>

        {/* Working hours */}
        <div>
          <label className="font-jetbrains text-[10px] tracking-label text-chrome block mb-2">WORKING HOURS</label>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <select
                value={registrationData.working_hours_start || 9}
                onChange={(e) => updateRegistration({ working_hours_start: Number(e.target.value) })}
                className="input-field appearance-none text-center font-jetbrains"
              >
                {Array.from({ length: 18 }, (_, i) => i + 6).map(h => (
                  <option key={h} value={h}>{h > 12 ? `${h - 12} PM` : h === 12 ? '12 PM' : `${h} AM`}</option>
                ))}
              </select>
            </div>
            <span className="font-jetbrains text-chrome text-sm">to</span>
            <div className="flex-1">
              <select
                value={registrationData.working_hours_end || 21}
                onChange={(e) => updateRegistration({ working_hours_end: Number(e.target.value) })}
                className="input-field appearance-none text-center font-jetbrains"
              >
                {Array.from({ length: 18 }, (_, i) => i + 6).map(h => (
                  <option key={h} value={h}>{h > 12 ? `${h - 12} PM` : h === 12 ? '12 PM' : `${h} AM`}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white px-6 py-4 border-t" style={{ borderColor: 'rgba(0,47,167,0.08)' }}>
        <button onClick={handleContinue} className="btn-primary">
          Continue
        </button>
      </div>
    </motion.div>
  );
}
