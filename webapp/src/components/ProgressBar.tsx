import { useTranslation } from "react-i18next";

interface ProgressBarProps {
  current: number;
  max: number;
  color: string;
}

export default function ProgressBar({ current, max, color }: ProgressBarProps) {
  const { t } = useTranslation();
  const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  const overLimit = current > max && max > 0;

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-text-secondary mb-1">
        <span>
          {current} / {max}
        </span>
        {overLimit && <span className="text-danger">{t("progressBar.overLimit")}</span>}
      </div>
      <div className="w-full h-2 bg-bg-surface rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${pct}%`,
            backgroundColor: overLimit ? "#EF4444" : color,
          }}
        />
      </div>
    </div>
  );
}
