import { useTranslation } from "react-i18next";
import { getZoneColor } from "../lib/colors";
import { HABIT_MATERIAL_ICONS } from "../lib/types";
import type { HabitType } from "../lib/types";

interface BarData {
  type: HabitType;
  current: number;
  max: number;
  color: string;
}

interface HabitProgressBarsProps {
  habits: BarData[];
  selected: HabitType;
  onSelect: (ht: HabitType) => void;
}

export default function HabitProgressBars({
  habits,
  selected,
  onSelect,
}: HabitProgressBarsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex-1 flex flex-col gap-3 min-w-0">
      {habits.map((habit) => {
        const pct = habit.max > 0 ? Math.min(habit.current / habit.max, 1) * 100 : 0;
        const isSelected = habit.type === selected;
        const countColor = getZoneColor(habit.current, habit.max);

        return (
          <button
            key={habit.type}
            onClick={() => onSelect(habit.type)}
            className={`flex flex-col gap-1.5 rounded-xl p-2.5 transition-all duration-150 active:scale-[0.97] ${
              isSelected
                ? "bg-white/[0.06]"
                : "bg-transparent"
            }`}
          >
            {/* Label row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span
                  className="material-symbols-outlined text-[16px]"
                  style={{ color: habit.color }}
                >
                  {HABIT_MATERIAL_ICONS[habit.type]}
                </span>
                <span className="text-sm font-medium text-[#F1F5F2]">
                  {t(`habits.${habit.type}`)}
                </span>
              </div>
              <span className="text-sm font-medium tabular-nums" style={{ color: countColor }}>
                {habit.current}
                <span className="text-[#5C716A]">/{habit.max}</span>
              </span>
            </div>
            {/* Bar */}
            <div className="w-full h-2 rounded-full bg-[#23352b] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${pct}%`,
                  backgroundColor: habit.color,
                }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
