"use client";

type ProgressRingProps = {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
};

export function ProgressRing({ percentage, size = 64, strokeWidth = 6, className }: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, percentage));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const center = size / 2;

  const strokeColor =
    clamped >= 80 ? "stroke-posted" : clamped >= 50 ? "stroke-pending-badge" : "stroke-primary";

  return (
    <svg width={size} height={size} className={className} viewBox={`0 0 ${size} ${size}`}>
      {/* Background track */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        className="stroke-surface-secondary"
      />
      {/* Filled arc */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className={strokeColor}
        transform={`rotate(-90 ${center} ${center})`}
        style={{ transition: "stroke-dashoffset 0.4s ease" }}
      />
      {/* Center text */}
      <text
        x={center}
        y={center}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-heading text-[11px] font-semibold"
      >
        {Math.round(clamped)}%
      </text>
    </svg>
  );
}
