interface RingData {
  color: string;
  current: number;
  max: number;
}

interface MultiRingProgressProps {
  habits: RingData[];
  totalCount: number;
  label: string;
}

export default function MultiRingProgress({
  habits,
  totalCount,
  label,
}: MultiRingProgressProps) {
  const size = 150;
  const center = size / 2;
  const strokeWidth = 10;
  const gap = 4;
  const outerRadius = 62;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {habits.map((habit, i) => {
          const radius = outerRadius - i * (strokeWidth + gap);
          const circumference = 2 * Math.PI * radius;
          const pct = habit.max > 0 ? Math.min(habit.current / habit.max, 1) : 0;
          const offset = circumference - pct * circumference;

          return (
            <g key={i}>
              {/* Track */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke="#23352b"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />
              {/* Progress arc */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={habit.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="transition-all duration-500 ease-out"
              />
            </g>
          );
        })}
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-light tracking-tight text-[#F1F5F2]">
          {totalCount}
        </span>
        <span className="text-xs font-medium tracking-wide uppercase text-[#5C716A] mt-0.5">
          {label}
        </span>
      </div>
    </div>
  );
}
