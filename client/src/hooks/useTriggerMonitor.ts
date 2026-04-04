import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppStore } from '../store/appStore';

export function useTriggerMonitor() {
  const socketRef = useRef<Socket | null>(null);
  const { 
    user, addTrigger, setConditions, addClaim, updateClaim,
    setShowPayout, setAlertBanner, addToast
  } = useAppStore();

  useEffect(() => {
    const socket = io('/', { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected');
      if (user?.id) {
        socket.emit('join', user.id);
      }
    });

    // New trigger detected
    socket.on('trigger:new', (trigger) => {
      console.log('[Socket] New trigger:', trigger);
      addTrigger(trigger);

      const triggerEmoji: Record<string, string> = {
        rain: '🌧', flood: '🌊', heat: '🔥', aqi: '🌫', demand: '📉', traffic: '🚗'
      };
      const triggerLabel: Record<string, string> = {
        rain: 'Heavy rain', flood: 'Flood alert', heat: 'Extreme heat',
        aqi: 'Hazardous AQI', demand: 'Demand drop', traffic: 'High traffic'
      };

      const emoji = triggerEmoji[trigger.type] || '⚠';
      const label = triggerLabel[trigger.type] || trigger.type;

      setAlertBanner({
        message: `${emoji} ${label} in ${trigger.zone} detected. Coverage active.`,
        type: trigger.severity === 'critical' ? 'danger' : 'warn',
      });

      // Auto-dismiss after 8s
      setTimeout(() => setAlertBanner(null), 8000);
    });

    // Claim created
    socket.on('claim:created', (claim) => {
      console.log('[Socket] Claim created:', claim);
      addClaim(claim);
      addToast({ message: 'Claim detected. Processing...', type: 'info' });
    });

    // Claim approved — show payout
    socket.on('claim:approved', (claim) => {
      console.log('[Socket] Claim approved:', claim);
      updateClaim(claim.id, { status: 'paid' });
      setShowPayout(true, claim.payout_amount);
    });

    // Claim under review
    socket.on('claim:review', (claim) => {
      console.log('[Socket] Claim under review:', claim);
      updateClaim(claim.id, { status: 'under_review' });
      addToast({ message: 'Claim is being verified. No action needed from you.', type: 'warning' });
    });

    // Conditions update
    socket.on('conditions:update', (conditions) => {
      setConditions(conditions);
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id]);

  return socketRef;
}
