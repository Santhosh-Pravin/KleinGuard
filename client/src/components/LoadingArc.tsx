export default function LoadingArc({ size = 80, color = '#00CFFF' }: { size?: number; color?: string }) {
  const r = (size - 8) / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circumference}
        className="animate-breathe-arc"
        style={{ transformOrigin: 'center' }}
        opacity="0.3"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r * 0.65}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={circumference * 0.65}
        className="animate-breathe-arc"
        style={{ transformOrigin: 'center', animationDelay: '0.4s' }}
        opacity="0.2"
      />
    </svg>
  );
}
