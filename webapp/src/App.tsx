import { useEffect } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { tg } from "./lib/telegram";
import { useAuth } from "./hooks/useAuth";
import Layout from "./components/Layout";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Stats from "./pages/Stats";
import Health from "./pages/Health";
import Profile from "./pages/Profile";
import Community from "./pages/Community";
import GroupDetail from "./pages/GroupDetail";

export default function App() {
  const { t } = useTranslation();
  const { user, profiles, loading, error } = useAuth();

  useEffect(() => {
    tg.ready();
    tg.expand();
    if (tg.isVersionAtLeast("6.1")) {
      tg.setHeaderColor("#1a2c22");
      tg.setBackgroundColor("#122017");
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#122017] flex items-center justify-center">
        <div className="animate-pulse space-y-4 w-64">
          <div className="h-4 bg-white/5 rounded-lg w-3/4 mx-auto" />
          <div className="h-10 bg-white/5 rounded-xl w-1/2 mx-auto" />
          <div className="h-3 bg-white/5 rounded-lg w-2/3 mx-auto" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#122017] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full mb-4 bg-white/5 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[28px] text-[#EF4444]">
              error
            </span>
          </div>
          <p className="text-[#EF4444] font-semibold text-base mb-2">
            {t("common.error")}
          </p>
          <p className="text-[#94A3A1] text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="min-h-[48px] px-6 rounded-2xl bg-[#1fc762] text-[#0d1a12] font-semibold text-sm tracking-wide active:scale-[0.97] active:bg-[#17a34a] transition-all duration-150"
          >
            {t("common.retry", "Qayta urinish")}
          </button>
        </div>
      </div>
    );
  }

  const needsOnboarding = !profiles || profiles.length === 0;

  return (
    <HashRouter>
      <Routes>
        {needsOnboarding ? (
          <Route path="*" element={<Onboarding />} />
        ) : (
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/health" element={<Health />} />
            <Route path="/community" element={<Community />} />
            <Route path="/group/:id" element={<GroupDetail />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        )}
      </Routes>
    </HashRouter>
  );
}
