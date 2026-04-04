import { useState, useEffect, useRef } from 'react';

export function useCountUp(target: number, duration: number = 800, enabled: boolean = true) {
  const [value, setValue] = useState(0);
  const startTime = useRef<number | null>(null);
  const animFrame = useRef<number>(0);

  useEffect(() => {
    if (!enabled || target === 0) {
      setValue(target);
      return;
    }

    setValue(0);
    startTime.current = null;

    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      
      // EaseOut curve
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));

      if (progress < 1) {
        animFrame.current = requestAnimationFrame(animate);
      }
    };

    animFrame.current = requestAnimationFrame(animate);

    return () => {
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
    };
  }, [target, duration, enabled]);

  return value;
}
