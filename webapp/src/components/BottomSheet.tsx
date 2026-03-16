import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { haptic } from "../lib/telegram";
import { HABIT_ICONS, HABIT_COLORS } from "../lib/types";
import { getZoneColor } from "../lib/colors";
import type { HabitType, HabitProfile, TodayCounts } from "../lib/types";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  profiles: HabitProfile[];
  todayCounts: TodayCounts;
  onLog: (habitType: HabitType) => void;
}

export default function BottomSheet({
  open,
  onClose,
  profiles,
  todayCounts,
  onLog,
}: BottomSheetProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const handleLog = (ht: HabitType) => {
    haptic("light");
    onLog(ht);
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-bg-card rounded-t-xl px-4 py-3.5 pb-8 animate-slide-up border-t border-white/[0.08]">
        {/* Drag handle */}
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        <h3 className="text-lg font-semibold text-text-primary mb-4">
          {t("bottomSheet.title")}
        </h3>

        <div className="space-y-2.5">
          {profiles.map((p) => {
            const ht = p.habit_type;
            const count = todayCounts[ht] ?? 0;
            const color = HABIT_COLORS[ht];
            const limit = p.daily_limit ?? p.daily_baseline;
            const countColor = getZoneColor(count, limit);

            return (
              <div
                key={ht}
                className="flex items-center justify-between bg-bg-surface rounded-lg p-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                    style={{ backgroundColor: color + "20" }}
                  >
                    {HABIT_ICONS[ht]}
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">
                      {t(`habits.${ht}`)}
                    </p>
                    <p className="text-sm text-text-muted">
                      {t("common.today")}:{" "}
                      <span style={{ color: countColor }}>{count}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleLog(ht)}
                  className="h-11 px-5 rounded-full font-semibold text-[#F1F5F2] text-sm transition-transform duration-100 active:scale-[0.97]"
                  style={{ backgroundColor: color }}
                >
                  +1
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
