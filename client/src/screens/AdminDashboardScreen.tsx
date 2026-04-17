import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { formatINR, formatTime, getTriggerInfo, getClaimStatusInfo } from '../lib/formatters';

const pageTransition: any = { duration: 0.45, ease: [0.22, 1, 0.36, 1] };

export default function AdminDashboardScreen() {
  const { setScreen, claims } = useAppStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'verification'>('overview');
  
  // Data calculations
  const totalClaims = claims.length;
  const approvedClaims = claims.filter(c => c.status === 'paid' || c.status === 'auto_approved').length;
  const totalPayouts = claims.reduce((sum, c) => sum + (c.status === 'paid' ? c.payout_amount : 0), 0);
  const baselinePremium = Math.max(1000, totalClaims * 1500); // Mock premium revenue
  const lossRatio = ((totalPayouts / baselinePremium) * 100).toFixed(1);

  const avgFraudScore = claims.length ? claims.reduce((sum, c) => sum + ((c as any).fraud_score || 0.1), 0) / claims.length : 0;
  const highRiskClaims = claims.filter(c => ((c as any).fraud_score || 0) > 0.65).length;
  const lowRiskClaims = claims.filter(c => ((c as any).fraud_score || 0) < 0.35).length;
  
  const handleExit = () => {
    document.documentElement.classList.remove('dark');
    setScreen('splash');
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={pageTransition}
      className="min-h-screen bg-ink pb-24 dark"
    >
      {/* Header */}
      <div className="bg-[#03060C] px-6 pt-10 pb-4 border-b border-white/10 sticky top-0 z-20 flex justify-between items-center">
        <h1 className="font-syne font-extrabold text-[20px] text-neonPink tracking-headline" style={{ textShadow: '0 0 10px rgba(255,0,255,0.5)' }}>Admin Center</h1>
        <button onClick={handleExit} className="text-white bg-white/10 px-3 py-1.5 rounded-sm font-jetbrains text-[10px] uppercase">Exit</button>
      </div>

      {/* Tabs */}
      <div className="flex bg-[#03060C] border-b border-white/5">
        <button onClick={() => setActiveTab('overview')} className={`flex-1 py-3 font-jetbrains text-[11px] font-bold uppercase transition-colors ${activeTab === 'overview' ? 'text-neonPink border-b-2 border-neonPink' : 'text-chrome'}`}>Overview</button>
        <button onClick={() => setActiveTab('verification')} className={`flex-1 py-3 font-jetbrains text-[11px] font-bold uppercase transition-colors ${activeTab === 'verification' ? 'text-neonPink border-b-2 border-neonPink' : 'text-chrome'}`}>Verification</button>
      </div>

      <div className="p-5 space-y-4">
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-3">
              <div className="card p-4 bg-ink/50">
                <p className="font-jetbrains text-[9px] text-chrome mb-1 uppercase">Total claims</p>
                <p className="font-data text-[24px] text-white">{totalClaims}</p>
              </div>
              <div className="card p-4 bg-ink/50">
                <p className="font-jetbrains text-[9px] text-chrome mb-1 uppercase">Approved</p>
                <p className="font-data text-[24px] text-safe">{approvedClaims} <span className="text-xs text-chrome ml-1">({Math.round(approvedClaims/(totalClaims||1)*100)}%)</span></p>
              </div>
              <div className="card p-4 bg-ink/50 border-danger/30">
                <p className="font-jetbrains text-[9px] text-danger mb-1 uppercase">Loss Ratio</p>
                <p className={`font-data text-[28px] ${Number(lossRatio) > 80 ? 'text-danger' : 'text-neonPink'}`}>{lossRatio}%</p>
                <p className="font-jetbrains text-[8px] text-chrome mt-1">Premium: {formatINR(baselinePremium)}</p>
              </div>
              <div className="card p-4 bg-ink/50">
                <p className="font-jetbrains text-[9px] text-chrome mb-1 uppercase">Total Payouts</p>
                <p className="font-data text-[24px] text-white">{formatINR(totalPayouts)}</p>
              </div>
            </div>

            <div className="card p-5 border-neonPink/30" style={{ boxShadow: '0 0 15px rgba(255,0,255,0.1)' }}>
              <h3 className="font-syne font-bold text-white text-sm mb-3">AI Engine Insights</h3>
              <div className="space-y-3">
                 <div className="flex justify-between items-center">
                   <span className="font-jetbrains text-[10px] text-chrome">Avg Fraud Score</span>
                   <span className="font-data text-white">{(avgFraudScore * 100).toFixed(1)}%</span>
                 </div>
                 <div className="w-full bg-mist/10 rounded-full h-1.5">
                   <div className="bg-warn h-1.5 rounded-full" style={{ width: `${avgFraudScore * 100}%` }}></div>
                 </div>
                 <div className="flex justify-between items-center pt-2">
                   <span className="font-jetbrains text-[10px] text-chrome">High Risk Flags</span>
                   <span className="font-data text-danger">{highRiskClaims} claims</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="font-jetbrains text-[10px] text-chrome">Low Risk Auto-Pays</span>
                   <span className="font-data text-safe">{lowRiskClaims} claims</span>
                 </div>
              </div>
            </div>

            <div className="card p-5 border-white/10">
              <h3 className="font-syne font-bold text-white text-sm mb-3">Predictive Analytics (Next 7 Days)</h3>
              <div className="space-y-2">
                 <div className="bg-[#03060C] p-3 rounded-lg border border-danger/20 flex gap-3 items-center">
                   <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center text-xl">⛈️</div>
                   <div className="flex-1">
                     <div className="flex justify-between items-end">
                       <p className="font-jetbrains text-[10px] text-chrome uppercase">Velachery · Tuesday</p>
                       <span className="font-data text-[12px] text-danger">82% Risk</span>
                     </div>
                     <p className="font-syne text-[12px] text-white mt-1">High probability of extreme rainfall. Auto-claims likely to spike &gt;300%.</p>
                   </div>
                 </div>

                 <div className="bg-[#03060C] p-3 rounded-lg border border-warn/20 flex gap-3 items-center">
                   <div className="w-10 h-10 rounded-full bg-warn/10 flex items-center justify-center text-xl">🌫️</div>
                   <div className="flex-1">
                     <div className="flex justify-between items-end">
                       <p className="font-jetbrains text-[10px] text-chrome uppercase">Adyar · Thursday</p>
                       <span className="font-data text-[12px] text-warn">65% Risk</span>
                     </div>
                     <p className="font-syne text-[12px] text-white mt-1">Hazardous AQI expected from thermal inversion. Moderate claims predicted.</p>
                   </div>
                 </div>
              </div>
            </div>

          </motion.div>
        )}

        {activeTab === 'verification' && (
          <VerificationPanel />
        )}
      </div>

    </motion.div>
  );
}

import { getAdminPendingClaims, resolveAdminClaim } from '../lib/api';
import { AnimatePresence } from 'framer-motion';

function VerificationPanel() {
  const [pendingClaims, setPendingClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      const res = await getAdminPendingClaims();
      setPendingClaims(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id: number, action: 'accept' | 'reject') => {
    try {
      await resolveAdminClaim(id, action);
      // Optimistically remove
      setPendingClaims(prev => prev.filter(c => c.id !== id));
    } catch (e) {
      console.error('Resolution failed', e);
    }
  };

  if (loading) return <div className="text-chrome font-syne text-center py-10">Loading queue...</div>;

  if (pendingClaims.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-8 border-white/5 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-safe/10 text-safe flex items-center justify-center text-2xl mb-4">✨</div>
        <h3 className="font-syne font-bold text-white text-base">Inbox Zero</h3>
        <p className="font-jetbrains text-[11px] text-chrome mt-2">No claims require manual intervention right now.</p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pb-10">
      {pendingClaims.map(claim => {
        const trigger = getTriggerInfo(claim.trigger_type);
        const isExpanded = expandedId === claim.id;
        
        return (
          <div key={claim.id} className="card border-warn/20 overflow-hidden bg-ink/40">
            <div 
              className="p-4 flex items-center justify-between cursor-pointer"
              onClick={() => setExpandedId(isExpanded ? null : claim.id)}
            >
              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 rounded-full bg-[#03060C] flex items-center justify-center text-xl border border-white/5">
                  {trigger.emoji}
                </div>
                <div>
                  <h4 className="font-syne font-bold text-white text-sm">{claim.user_name || 'Worker'}</h4>
                  <p className="font-jetbrains text-[9px] text-chrome">{trigger.label} · {claim.trigger_zone}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-data text-white text-base">{formatINR(claim.payout_amount)}</p>
                <div className="flex justify-end mt-1">
                  <span className={`inline-block px-1.5 py-0.5 rounded font-jetbrains text-[7px] border font-bold uppercase ${claim.fraud_score > 0.65 ? 'bg-danger/10 border-danger/30 text-danger' : 'bg-warn/10 border-warn/30 text-warn'}`}>
                    {claim.fraud_score > 0.65 ? 'ESCALATED' : 'REVIEW'}
                  </span>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {isExpanded && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} 
                  animate={{ height: 'auto', opacity: 1 }} 
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-[#03060C] border-t border-white/5"
                >
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3 mb-2">
                       <div>
                          <p className="font-jetbrains text-[9px] text-chrome uppercase">Timestamp</p>
                          <p className="font-data text-xs text-white">{formatTime(claim.created_at)}</p>
                       </div>
                       <div>
                          <p className="font-jetbrains text-[9px] text-chrome uppercase">Fraud Margin</p>
                          <p className={`font-data text-xs ${claim.fraud_score > 0.65 ? 'text-danger' : 'text-warn'}`}>{(claim.fraud_score * 100).toFixed(1)}%</p>
                       </div>
                    </div>

                    <div className="space-y-1 block pb-2">
                      <p className="font-jetbrains text-[9px] text-chrome uppercase border-b border-white/5 pb-1 mb-1">Risk Factors</p>
                      {Object.keys(claim.signal_summary?.fraud_signals || {}).length > 0 ? (
                        Object.keys(claim.signal_summary.fraud_signals).map(flag => (
                          <div key={flag} className="flex justify-between font-jetbrains text-[10px]">
                            <span className="text-danger">⚠️ {flag.replace(/_/g, ' ')}</span>
                            <span className="text-white">Flagged</span>
                          </div>
                        ))
                      ) : (
                        <p className="font-jetbrains text-[10px] text-chrome italic">Algorithm uncertainty (heuristic margin).</p>
                      )}
                    </div>
                    
                    <div className="flex gap-3 pt-2 border-t border-white/5">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleResolve(claim.id, 'reject'); }}
                        className="flex-1 py-3 text-center rounded bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20 font-syne font-bold text-sm transition-colors"
                      >
                        REJECT
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleResolve(claim.id, 'accept'); }}
                        className="flex-1 py-3 text-center rounded bg-safe/10 text-safe border border-safe/30 hover:bg-safe/20 font-syne font-bold text-sm transition-colors"
                      >
                        APPROVE
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </motion.div>
  );
}
