import { useTranslation } from "react-i18next";
import type { MilestoneData } from "../lib/types";

interface HealthTimelineProps {
  milestones: MilestoneData[];
  hoursSince: number;
}

export default function HealthTimeline({
  milestones,
  hoursSince,
}: HealthTimelineProps) {
  const { t, i18n } = useTranslation();
  const isRu = i18n.language === "ru";

  // Find the index of the first non-unlocked milestone (the "in progress" one)
  const firstLockedIdx = milestones.findIndex((m) => !m.unlocked);

  return (
    <div className="relative pl-2">
      {milestones.map((m, i) => {
        const isLast = i === milestones.length - 1;
        const progress = m.unlocked
          ? 100
          : Math.min((hoursSince / m.hours_after) * 100, 99);
        // Only the first non-unlocked milestone is "in progress", rest are locked
        const isInProgress = i === firstLockedIdx && progress > 0;

        const title = isRu && m.title_ru ? m.title_ru : m.title_uz;
        const description = isRu && m.description_ru ? m.description_ru : m.description_uz;

        return (
          <div key={m.id} className="relative flex gap-4 pb-8 group">
            {/* Connecting line */}
            {!isLast && (
              <div
                className={`absolute left-[19px] top-10 bottom-0 w-[2px] ${
                  m.unlocked
                    ? "bg-brand"
                    : isInProgress
                    ? "dashed-line"
                    : "dashed-line"
                }`}
              />
            )}

            {/* Icon circle */}
            <div className="relative z-10 flex-shrink-0">
              {m.unlocked ? (
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-brand text-[#F1F5F2] shadow-md shadow-brand/30 ring-4 ring-bg">
                  <span className="material-symbols-outlined text-[24px]">
                    check
                  </span>
                </div>
              ) : isInProgress ? (
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-bg-card border-2 border-warning text-warning shadow-md shadow-warning/10 ring-4 ring-bg">
                  <span className="material-symbols-outlined animate-pulse-soft text-[20px]">
                    progress_activity
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-bg-surface text-text-muted ring-4 ring-bg">
                  <span className="material-symbols-outlined text-[20px]">
                    lock
                  </span>
                </div>
              )}
            </div>

            {/* Content card */}
            <div className="flex-1">
              <div
                className={`relative bg-bg-card rounded-2xl p-5 shadow-card border overflow-hidden ${
                  m.unlocked
                    ? "border-border milestone-unlocked"
                    : isInProgress
                    ? "border-warning/30 ring-1 ring-warning/10"
                    : "border-border"
                }`}
              >
                {/* Blur overlay for locked milestones */}
                {!m.unlocked && !isInProgress && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-bg-card/30 backdrop-blur-none">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-surface/90 text-text-muted">
                      <span className="material-symbols-outlined text-[18px]">
                        lock
                      </span>
                      <span className="text-xs font-medium">
                        {m.time_until ? `${m.time_until} ${t("health.remaining")}` : t("health.locked")}
                      </span>
                    </div>
                  </div>
                )}

                <div className={!m.unlocked && !isInProgress ? "milestone-blur select-none" : ""}>
                  <div className="flex justify-between items-start mb-2">
                    <h3
                      className={`text-lg font-semibold ${
                        m.unlocked || isInProgress
                          ? "text-text-primary"
                          : "text-text-muted"
                      }`}
                    >
                      {title}
                    </h3>
                    {m.unlocked && (
                      <span className="px-2.5 py-0.5 rounded-full bg-brand/10 text-brand text-xs font-bold uppercase tracking-wider">
                        {t("health.completed")}
                      </span>
                    )}
                    {isInProgress && (
                      <span className="px-2.5 py-0.5 rounded-full bg-warning/10 text-warning text-xs font-bold uppercase tracking-wider">
                        {t("health.inProgress")}
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-sm mb-4 leading-relaxed ${
                      m.unlocked || isInProgress
                        ? "text-text-secondary"
                        : "text-text-muted"
                    }`}
                  >
                    {description}
                  </p>

                  {/* Progress bar */}
                  <div className="relative w-full h-1.5 bg-bg-surface rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${m.unlocked ? 100 : progress}%`,
                        backgroundColor: m.unlocked
                          ? "#1fc762"
                          : isInProgress
                          ? "#F59E0B"
                          : "#23352b",
                        ...(isInProgress
                          ? {
                              boxShadow: "0 0 10px rgba(245,158,11,0.5)",
                            }
                          : {}),
                      }}
                    />
                  </div>

                  {/* Status text */}
                  {isInProgress && (
                    <p className="text-right text-xs font-medium text-warning mt-2">
                      {Math.round(progress)}%
                    </p>
                  )}
                  {m.unlocked && m.unlocked_ago && (
                    <p className="text-xs text-brand font-medium mt-2">
                      {m.unlocked_ago}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
