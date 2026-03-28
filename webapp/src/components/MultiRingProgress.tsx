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
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const gapDegrees = 5;
  const gapArc = (gapDegrees / 360) * circumference;

  // Filter habits that have a max > 0
  const activeHabits = habits.filter((h) => h.max > 0);
  const numActive = activeHabits.length;

  // Calculate each habit's ratio (clamped to 1)
  const ratios = activeHabits.map((h) =>
    Math.min(h.current / h.max, 1)
  );
  const totalRatio = ratios.reduce((s, r) => s + r, 0);

  // Available arc after gaps
  const totalGap = numActive > 0 ? numActive * gapArc : 0;
  const availableArc = circumference - totalGap;

  // Each habit's arc length proportional to its ratio
  const arcLengths = ratios.map((r) =>
    totalRatio > 0 ? (r / totalRatio) * availableArc : 0
  );

  // If no data, show equal segments as background guide
  const showEmpty = totalRatio === 0;
  const equalArc = numActive > 0 ? availableArc / numActive : 0;

  // Calculate starting angle offset for each segment
  const startOffsets: number[] = [];
  let accumulated = 0;
  for (let i = 0; i < numActive; i++) {
    startOffsets.push(accumulated);
    const segArc = showEmpty ? equalArc : arcLengths[i];
    accumulated += segArc + gapArc;
  }

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        {/* Background track ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="#23352b"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Segment arcs */}
        {activeHabits.map((habit, i) => {
          const segArc = showEmpty ? equalArc : arcLengths[i];
          if (segArc <= 0) return null;

          // stroke-dasharray: [visible arc, rest of circumference]
          const dashArray = `${segArc} ${circumference - segArc}`;
          // stroke-dashoffset: shift backwards to position the segment
          // We start from the top (12 o'clock), so offset by -startOffsets[i]
          // Since SVG circle starts at 3 o'clock, rotate -90 via startAngle
          const startAngle = -90 + (startOffsets[i] / circumference) * 360;

          return (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke={showEmpty ? habit.color : habit.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={dashArray}
              strokeOpacity={showEmpty ? 0.2 : 1}
              transform={`rotate(${startAngle} ${center} ${center})`}
              className="transition-all duration-500 ease-out"
            />
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
