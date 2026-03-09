import { getZoneColor } from "../lib/colors";

interface CircularProgressProps {
  current: number;
  max: number;
  label: string;
}

export default function CircularProgress({
  current,
  max,
  label,
}: CircularProgressProps) {
  const size = 200;
  const strokeWidth = 16;
  const radius = 88;
  const circumference = 2 * Math.PI * radius;

  const pct = max > 0 ? Math.min(current / max, 1) : 0;
  const offset = circumference - pct * circumference;

  const zoneColor = getZoneColor(current, max);

  return (
    <div className="relative w-[200px] h-[200px]">
      <svg className="w-full h-full -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#23352b"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={zoneColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-hero tracking-tight transition-colors duration-500"
          style={{ color: zoneColor }}
        >
          {current}
        </span>
        <span className="text-text-muted font-medium text-sm mt-1">
          / {max} {label}
        </span>
      </div>
    </div>
  );
}
