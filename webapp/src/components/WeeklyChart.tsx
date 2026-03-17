import {
  Line,
  Area,
  ComposedChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
} from "recharts";
import type { DailyEntry, HabitProfile, HabitType } from "../lib/types";
import { HABIT_COLORS, HABIT_LABELS } from "../lib/types";
import { getZoneColor } from "../lib/colors";

const UZ_DAYS_SHORT = ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"];

interface WeeklyChartProps {
  data: DailyEntry[];
  profiles: HabitProfile[];
  days: number;
  habitType?: HabitType;
}

interface DotProps {
  cx?: number;
  cy?: number;
  payload?: DailyEntry;
}

export default function WeeklyChart({
  data,
  profiles,
  days,
  habitType,
}: WeeklyChartProps) {
  // Fill in missing dates (use UTC to avoid timezone mismatch)
  const filledData: DailyEntry[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
    const dateStr = d.toISOString().split("T")[0];
    const existing = data.find((e) => e.date === dateStr);
    filledData.push({
      date: dateStr,
      sigaret: existing?.sigaret ?? 0,
      nos: existing?.nos ?? 0,
      alkogol: existing?.alkogol ?? 0,
    });
  }

  const formatDate = (dateStr: string, index: number) => {
    const parts = dateStr.split("-");
    const d = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
    if (days <= 7) {
      return UZ_DAYS_SHORT[d.getUTCDay()];
    }
    // For month view, show day-of-month every 5th tick to avoid crowding
    const dayOfMonth = d.getUTCDate();
    if (index % 5 === 0 || index === filledData.length - 1) {
      return String(dayOfMonth);
    }
    return "";
  };

  const activeHabits = habitType
    ? [habitType]
    : profiles.map((p) => p.habit_type);

  // Build a limit lookup for zone-colored dots
  const limitByHabit: Record<string, number> = {};
  for (const p of profiles) {
    limitByHabit[p.habit_type] = p.daily_limit ?? p.daily_baseline;
  }

  return (
    <div style={{ width: '100%', minHeight: 160 }}>
      <ResponsiveContainer width="100%" height={160}>
        <ComposedChart data={filledData}>
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="#5C716A"
            fontSize={12}
            fontFamily="Lexend"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            hide
            domain={[0, (dataMax: number) => Math.max(dataMax, 1)]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#23352b",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "8px",
              fontSize: "12px",
              fontFamily: "Lexend",
              color: "#F1F5F2",
            }}
            labelFormatter={(label) => String(label)}
          />
          {activeHabits.map((ht) => {
            const color = HABIT_COLORS[ht as HabitType];
            return (
              <Area
                key={`area-${ht}`}
                type="monotone"
                dataKey={ht}
                fill={color}
                fillOpacity={0.15}
                stroke="none"
                tooltipType="none"
              />
            );
          })}
          {activeHabits.map((ht) => {
            const limit = limitByHabit[ht] ?? 0;

            const renderDot = (props: DotProps & { index?: number }) => {
              const { cx, cy, payload, index } = props;
              if (cx == null || cy == null || !payload) return <g key={`empty-${index}`} />;
              const value = (payload[ht as keyof DailyEntry] as number) ?? 0;
              const dotColor = getZoneColor(value, limit);
              return (
                <circle
                  key={`dot-${index}`}
                  cx={cx}
                  cy={cy}
                  r={3}
                  fill={dotColor}
                  stroke={dotColor}
                  strokeWidth={2}
                />
              );
            };

            return (
              <Line
                key={ht}
                type="monotone"
                dataKey={ht}
                name={HABIT_LABELS[ht as HabitType]}
                stroke={HABIT_COLORS[ht as HabitType]}
                strokeWidth={3}
                dot={renderDot}
                activeDot={{ r: 5 }}
              />
            );
          })}
          {profiles.map((p) => {
            const limit = p.daily_limit ?? p.daily_baseline;
            if (!limit) return null;
            return (
              <ReferenceLine
                key={`limit-${p.habit_type}`}
                y={limit}
                stroke="#EF4444"
                strokeDasharray="6 4"
                strokeOpacity={0.6}
                strokeWidth={1.5}
                label={{
                  value: `${limit}`,
                  position: "right",
                  fill: "#EF444499",
                  fontSize: 10,
                  fontFamily: "Lexend",
                }}
              />
            );
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
