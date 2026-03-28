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

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
): string {
  // Convert degrees to radians, offset by -90 so 0° = 12 o'clock
  const startRad = ((startDeg - 90) * Math.PI) / 180;
  const endRad = ((endDeg - 90) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
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
  const gapDeg = 8;

  // Round caps extend by strokeWidth/2 beyond the arc endpoint.
  // Inset arcs by this amount so caps don't overflow into the gap.
  const capOffsetDeg = ((strokeWidth / 2) / (2 * Math.PI * radius)) * 360;

  // Only consider habits with max > 0
  const activeHabits = habits.filter((h) => h.max > 0);
  const N = activeHabits.length;

  // Each habit gets an equal sector of 360/N degrees
  const sectorDeg = N > 0 ? 360 / N : 360;
  // Available degrees per segment = sector minus gap
  const availableDeg = N > 1 ? sectorDeg - gapDeg : sectorDeg;

  const segments = activeHabits.map((h, i) => {
    const ratio = Math.min(h.current / h.max, 1);
    const arcDeg = ratio * availableDeg;
    const startDeg = i * sectorDeg + (N > 1 ? gapDeg / 2 : 0);
    return { arcDeg, startDeg, availableDeg, color: h.color, current: h.current };
  });

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        {/* Background track segments with gaps */}
        {N > 1 ? (
          segments.map((seg, i) => (
            <path
              key={`bg-${i}`}
              d={describeArc(
                center, center, radius,
                seg.startDeg + capOffsetDeg,
                seg.startDeg + seg.availableDeg - capOffsetDeg,
              )}
              fill="none"
              stroke="#23352b"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          ))
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

          const insetStart = seg.startDeg + capOffsetDeg;
          const insetEnd = seg.startDeg + seg.arcDeg - capOffsetDeg;
          if (insetEnd <= insetStart) return null;

          return (
            <path
              key={i}
              d={describeArc(center, center, radius, insetStart, insetEnd)}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
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
