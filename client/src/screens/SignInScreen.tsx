import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { sendOtp, verifyOtp } from '../lib/api';

const pageTransition: any = { duration: 0.45, ease: [0.22, 1, 0.36, 1] };

export default function SignInScreen() {
  const { setScreen, setToken, setUser } = useAppStore();
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [sendingOTP, setSendingOTP] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    if (digits.length > 5) return `${digits.slice(0, 5)} ${digits.slice(5)}`;
    return digits;
  };

  const handleSendOTP = async () => {
    if (phone.length < 10) return;
    setSendingOTP(true);
    setError('');
    try {
      await sendOtp(`+91${phone}`);
      setStep(2);
    } catch {
      setError('Failed to send OTP. Try again.');
    } finally {
      setSendingOTP(false);
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) return;
    setVerifying(true);
    setError('');
    try {
      const res = await verifyOtp(`+91${phone}`, code);
      if (res.data.token) {
        setToken(res.data.token);
        // Load user
        const meRes = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${res.data.token}` }
        });
        if (meRes.ok) {
          const userData = await meRes.json();
          setUser(userData);
          setScreen('dashboard');
        } else {
          setError('User not found.');
        }
      } else {
         setError('Account not found. Please register first.');
      }
    } catch {
      setError('Invalid OTP code');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -20, opacity: 0 }}
      transition={pageTransition}
      className="min-h-screen bg-mist pb-28 pt-8 px-5"
    >
      <div className="flex items-center mb-8">
        <button onClick={() => setScreen('splash')} className="w-10 h-10 rounded-full bg-white flex items-center justify-center border" style={{ borderColor: 'rgba(0,47,167,0.05)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
      </div>

      <div className="mb-8">
        <h2 className="font-syne font-extrabold text-[32px] text-ink leading-tight tracking-headline">
          Welcome back
        </h2>
        <p className="font-jetbrains text-[12px] text-chrome mt-2">
          Enter your registered phone number.
        </p>
      </div>

      <div className="card p-5 space-y-6">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-md text-[11px] font-jetbrains border border-red-100">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="font-syne font-bold text-[13px] text-ink">Phone Number</label>
          <div className="flex items-center gap-3 rounded-[14px] border border-[rgba(0,47,167,0.15)] bg-mist px-4 py-[14px]">
            <span className="shrink-0 rounded-md bg-white px-2 py-1 font-jetbrains font-semibold text-[13px] text-klein shadow-sm">
              +91
            </span>
            <input
              type="tel"
              value={formatPhone(phone)}
              onChange={e => setPhone(e.target.value.replace(/\D/g, '').substring(0, 10))}
              disabled={step > 1}
              placeholder="98765 43210"
              className="min-w-0 flex-1 border-0 bg-transparent p-0 font-jetbrains text-[15px] text-ink outline-none placeholder:text-[#8FA3D4]"
            />
          </div>
          <p className="font-jetbrains text-[10px] text-chrome">
            Demo login: 9876543210 and OTP 123456
          </p>
        </div>

        <AnimatePresence>
          {step === 1 && (
            <motion.button
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              disabled={phone.length < 10 || sendingOTP}
              onClick={handleSendOTP}
              className="btn-primary"
            >
              {sendingOTP ? 'Sending...' : 'Send OTP'}
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {step === 2 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="space-y-4 pt-4 border-t"
              style={{ borderColor: 'rgba(0,47,167,0.08)' }}
            >
              <label className="font-syne font-bold text-[13px] text-ink block">Enter OTP</label>
              <div className="flex justify-between gap-2">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      const newOtp = [...otp];
                      newOtp[i] = val;
                      setOtp(newOtp);
                      if (val && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !digit && i > 0) {
                        document.getElementById(`otp-${i - 1}`)?.focus();
                      }
                    }}
                    className="w-11 h-12 text-center font-jetbrains font-bold text-lg bg-white border rounded-lg focus:border-klein focus:ring-1 focus:ring-klein outline-none transition-all"
                    style={{ borderColor: 'rgba(0,47,167,0.1)' }}
                  />
                ))}
              </div>
              <p className="font-jetbrains text-[10px] text-chrome text-center mt-2">
                Use 123456 in demo mode
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {step === 2 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-0 left-0 right-0 mx-auto w-full max-w-[430px] bg-white px-6 py-4 border-t"
            style={{ borderColor: 'rgba(0,47,167,0.08)' }}
          >
            <button
              onClick={handleVerify}
              disabled={verifying || otp.join('').length < 6}
              className="btn-primary"
            >
              {verifying ? 'Verifying...' : 'Sign In'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
