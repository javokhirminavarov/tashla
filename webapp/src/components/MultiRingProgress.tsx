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
  const gapDeg = 8;

  // Only consider habits with max > 0
  const activeHabits = habits.filter((h) => h.max > 0);
  const N = activeHabits.length;

  // Each habit gets an equal sector of 360/N degrees
  const sectorDeg = N > 0 ? 360 / N : 360;
  // Available degrees per segment = sector minus gap
  const availableDeg = N > 1 ? sectorDeg - gapDeg : sectorDeg;

  const segments = activeHabits.map((h, i) => {
    const ratio = Math.min(h.current / h.max, 1);
    // Fill ratio of available space (gap already subtracted)
    const arcDeg = ratio * availableDeg;
    // Segment starts at sector boundary + half gap offset
    const startDeg = i * sectorDeg + (N > 1 ? gapDeg / 2 : 0);
    return { arcDeg, startDeg, availableDeg, color: h.color, current: h.current };
  });

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        {/* Background track segments with gaps */}
        {N > 1 ? (
          segments.map((seg, i) => {
            const trackLength = (seg.availableDeg / 360) * circumference;
            const dashArray = `${trackLength} ${circumference - trackLength}`;
            const rotateAngle = -90 + seg.startDeg;
            return (
              <circle
                key={`bg-${i}`}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke="#23352b"
                strokeWidth={strokeWidth}
                strokeLinecap="butt"
                strokeDasharray={dashArray}
                transform={`rotate(${rotateAngle} ${center} ${center})`}
              />
            );
          })
        ) : (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#23352b"
            strokeWidth={strokeWidth}
          />
        )}

        {/* Segment arcs */}
        {segments.map((seg, i) => {
          if (seg.current === 0 || seg.arcDeg <= 0) return null;

          const segLength = (seg.arcDeg / 360) * circumference;
          const dashArray = `${segLength} ${circumference - segLength}`;
          // -90 shifts SVG's 3 o'clock start to 12 o'clock
          const rotateAngle = -90 + seg.startDeg;

          return (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeLinecap="butt"
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
