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
  const gapDeg = 6;

  // Only consider habits with max > 0
  const activeHabits = habits.filter((h) => h.max > 0);
  const N = activeHabits.length;

  // Each habit gets an equal slot of 360/N degrees
  // Within each slot, gapDeg is reserved for spacing
  const slotDeg = N > 0 ? 360 / N : 360;
  const usableDeg = slotDeg - (N > 1 ? gapDeg : 0);

  const segments = activeHabits.map((h, i) => {
    const ratio = Math.min(h.current / h.max, 1);
    const arcDeg = ratio * usableDeg;
    // Slot starts at i * slotDeg, offset by half gap for centering gaps between segments
    const slotStart = i * slotDeg + (N > 1 ? gapDeg / 2 : 0);
    return { arcDeg, slotStart, color: h.color, current: h.current };
  });

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
          strokeOpacity={0.6}
        />

        {/* Segment arcs */}
        {segments.map((seg, i) => {
          if (seg.current === 0 || seg.arcDeg <= 0) return null;

          const segLength = (seg.arcDeg / 360) * circumference;
          const dashArray = `${segLength} ${circumference - segLength}`;
          // Rotate so segment starts at correct position
          // -90 shifts SVG's 3 o'clock start to 12 o'clock
          const rotateAngle = -90 + seg.slotStart;

          return (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={dashArray}
              transform={`rotate(${rotateAngle} ${center} ${center})`}
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
