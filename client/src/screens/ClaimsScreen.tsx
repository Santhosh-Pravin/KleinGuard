import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { formatINR, formatTime, getTriggerInfo, getClaimStatusInfo } from '../lib/formatters';
import { getClaims } from '../lib/api';
import BottomNav from '../components/BottomNav';

const pageTransition = { duration: 0.45, ease: [0.22, 1, 0.36, 1] };

export default function ClaimsScreen() {
  const { claims, setClaims, setShowPayout } = useAppStore();
  const [tab, setTab] = useState<'active' | 'history'>('active');
  const [expandedClaim, setExpandedClaim] = useState<number | null>(null);

  useEffect(() => {
    getClaims().then(res => setClaims(res.data)).catch(() => {});
  }, []);

  const activeClaims = claims.filter(c => ['pending', 'auto_approved', 'under_review'].includes(c.status));
  const historyClaims = claims.filter(c => ['paid', 'declined', 'escalated'].includes(c.status));

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={pageTransition}
      className="min-h-screen bg-mist pb-24"
    >
      {/* Header */}
      <div className="bg-klein px-6 pt-10 pb-6">
        <h1 className="font-syne font-extrabold text-[24px] text-white tracking-headline">Claims</h1>
      </div>

      {/* Tabs */}
      <div className="px-6 pt-4 flex gap-1 bg-white -mt-1">
        {(['active', 'history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-3 font-jetbrains text-[11px] font-bold tracking-wide uppercase rounded-t-md transition-colors ${
              tab === t ? 'text-klein border-b-2 border-klein' : 'text-chrome'
            }`}>
            {t === 'active' ? 'Active Claims' : 'History'}
          </button>
        ))}
      </div>

      <div className="px-5 mt-4 space-y-3">
        {tab === 'active' ? (
          activeClaims.length === 0 ? (
            <p className="font-syne text-[13px] text-chrome italic py-8 text-center">
              No active claims. All clear.
            </p>
          ) : (
            activeClaims.map(claim => (
              <ActiveClaimCard key={claim.id} claim={claim} />
            ))
          )
        ) : (
          historyClaims.length === 0 ? (
            <p className="font-syne text-[13px] text-chrome italic py-8 text-center">
              No claims yet. A quiet week.
            </p>
          ) : (
            historyClaims.map(claim => {
              const trigger = getTriggerInfo(claim.trigger_type || '');
              const status = getClaimStatusInfo(claim.status);
              return (
                <motion.div
                  key={claim.id}
                  initial={{ y: 16, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="card overflow-hidden cursor-pointer"
                  onClick={() => setExpandedClaim(expandedClaim === claim.id ? null : claim.id)}
                >
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="px-2 py-1 bg-klein rounded-sm">
                        <span className="font-jetbrains text-[9px] text-white font-bold">
                          {formatTime(claim.created_at).split(',')[0]}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span>{trigger.emoji}</span>
                          <span className="font-syne font-bold text-[13px] text-ink">{trigger.label}</span>
                        </div>
                        <p className="font-jetbrains text-[9px] text-chrome">{claim.trigger_zone || 'Adyar'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-data text-[14px] text-ink">{formatINR(claim.payout_amount)}</p>
                      <span className={`${status.pillClass} font-jetbrains text-[8px] font-bold px-2 py-0.5 rounded-sm inline-block mt-1`}>
                        {status.label}
                      </span>
                    </div>
                  </div>

                  {/* Expanded signal breakdown */}
                  <AnimatePresence>
                    {expandedClaim === claim.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t px-4 pb-4 pt-3"
                        style={{ borderColor: 'rgba(0,47,167,0.06)' }}
                      >
                        <p className="font-jetbrains text-[9px] tracking-label text-chrome mb-2">SIGNAL BREAKDOWN</p>
                        <div className="space-y-1.5">
                          {Object.entries(claim.signal_summary || {}).map(([key, val]) => (
                            <div key={key} className="flex justify-between">
                              <span className="font-jetbrains text-[10px] text-chrome">{key.replace(/_/g, ' ')}</span>
                              <span className="font-jetbrains text-[10px] text-ink font-medium">{String(val)}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )
        )}
      </div>

      <BottomNav />
    </motion.div>
  );
}

function ActiveClaimCard({ claim }: { claim: any }) {
  const trigger = getTriggerInfo(claim.trigger_type || '');
  const steps = [
    { label: 'Triggered', done: true },
    { label: 'Verified', done: ['auto_approved', 'paid'].includes(claim.status) },
    { label: 'Paid', done: claim.status === 'paid' },
  ];

  const isReview = claim.status === 'under_review';

  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="card overflow-hidden"
    >
      {/* Status header */}
      <div className={`px-4 py-3 flex items-center gap-2 ${isReview ? 'bg-warn/10' : 'bg-safe/10'}`}>
        <div className={`w-2 h-2 rounded-full animate-pulse-dot ${isReview ? 'bg-warn' : 'bg-safe'}`} />
        <span className="font-jetbrains text-[11px] font-bold" style={{ color: isReview ? '#F5A800' : '#00C97A' }}>
          {isReview ? 'Under Review' : 'Processing'}
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* Claim details */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="font-jetbrains text-[9px] text-chrome">Trigger</p>
            <p className="font-syne font-bold text-[13px] text-ink">{trigger.emoji} {trigger.label}</p>
          </div>
          <div>
            <p className="font-jetbrains text-[9px] text-chrome">Zone</p>
            <p className="font-syne font-bold text-[13px] text-ink">{claim.trigger_zone || 'Adyar'}</p>
          </div>
          <div>
            <p className="font-jetbrains text-[9px] text-chrome">Expected</p>
            <p className="font-data text-[13px] text-ink">{formatINR(claim.expected_income)}</p>
          </div>
          <div>
            <p className="font-jetbrains text-[9px] text-chrome">Payout</p>
            <p className="font-data text-[13px] text-klein">{formatINR(claim.payout_amount)}</p>
          </div>
        </div>

        {/* Progress tracker */}
        <div className="flex items-center justify-between">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
                step.done ? 'bg-klein text-white' : 'bg-mist text-chrome'
              }`}>
                {step.done ? '✓' : i + 1}
              </div>
              <span className={`font-jetbrains text-[9px] ml-1.5 ${step.done ? 'text-ink' : 'text-chrome'}`}>
                {step.label}
              </span>
              {i < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-2 ${step.done ? 'bg-klein' : 'bg-mist'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Time estimate */}
        <p className="font-jetbrains text-[10px] text-chrome">
          Estimated payout: within 2–4 hrs
        </p>

        {/* Human copy */}
        <p className="font-syne text-[12px] text-chrome italic">
          {isReview
            ? 'Your claim is being verified. No action needed from you.'
            : 'Claim detected. Processing your payout.'}
        </p>
      </div>
    </motion.div>
  );
}
