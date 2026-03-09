import { useTranslation } from "react-i18next";
import { getZoneColor } from "../lib/colors";
import type { HabitProfile } from "../lib/types";

interface HabitCardProps {
  profile: HabitProfile;
  todayCount: number;
  selected: boolean;
  onSelect: () => void;
}

export default function HabitCard({
  profile,
  todayCount,
  selected,
  onSelect,
}: HabitCardProps) {
  const { t } = useTranslation();
  const ht = profile.habit_type;
  const limit = profile.daily_limit ?? profile.daily_baseline;
  const countColor = getZoneColor(todayCount, limit);

  return (
    <button
      onClick={onSelect}
      className={`flex-1 min-w-[100px] bg-bg-surface rounded-2xl p-4 flex flex-col items-center gap-1 border shadow-card transition-all active:scale-[0.97] transition-transform duration-100 ${
        selected
          ? "border-brand/50 ring-1 ring-brand/30"
          : "border-white/[0.06]"
      }`}
    >
      <span className="text-xs font-medium text-text-secondary">{t(`habits.${ht}`)}</span>
      <span className="text-sm font-bold" style={{ color: countColor }}>
        {todayCount}
        <span className="text-text-muted text-xs font-normal">/{limit}</span>
      </span>
    </button>
  );
}
