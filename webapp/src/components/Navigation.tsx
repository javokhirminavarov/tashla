import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface NavItem {
  path: string;
  labelKey: string;
  icon: string;
}

const navItems: NavItem[] = [
  { path: "/", labelKey: "nav.home", icon: "home" },
  { path: "/stats", labelKey: "nav.stats", icon: "bar_chart" },
  { path: "/health", labelKey: "nav.health", icon: "favorite" },
  { path: "/community", labelKey: "nav.friends", icon: "group" },
];

export default function Navigation() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0d1a12]/90 backdrop-blur-xl border-t border-white/[0.06] px-2 pb-[env(safe-area-inset-bottom)] z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-1 flex-col items-center gap-1 py-1 px-4 min-w-[64px] transition-colors active:scale-[0.97] transition-transform duration-100 ${
                active ? "text-brand" : "text-[#5C716A]"
              }`}
            >
              <span
                className={`material-symbols-outlined text-[22px] ${
                  active ? "material-symbols-filled" : ""
                }`}
              >
                {item.icon}
              </span>
              <span className="text-[11px] font-medium leading-normal">
                {t(item.labelKey)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
