import { useTranslation } from "react-i18next";
import type { MoneySaved as MoneySavedType, HabitProfile } from "../lib/types";

interface MoneySavedProps {
  money: MoneySavedType;
  profiles: HabitProfile[];
}

export default function MoneySaved({ money }: MoneySavedProps) {
  const { t } = useTranslation();
  const totalToday = Object.values(money.today).reduce((s, v) => s + v, 0);

  const formatMoney = (amount: number): string => {
    return amount.toLocaleString("uz-UZ") + " " + t("common.som");
  };

  return (
    <div className="w-full bg-bg-card rounded-2xl p-5 shadow-card border border-white/[0.06] relative overflow-hidden flex items-center justify-between transition-transform duration-100 active:scale-[0.97]">
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand rounded-l-2xl" />
      <div className="pl-3 flex flex-col gap-1">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
          {t("moneySaved.todaySaved")}
        </p>
        <p className="text-xl font-light tracking-tight text-text-primary">
          {formatMoney(totalToday)}
        </p>
      </div>
      <div className="h-10 w-10 rounded-full bg-brand/10 flex items-center justify-center text-brand">
        <span className="material-symbols-outlined">savings</span>
      </div>
    </div>
  );
}
