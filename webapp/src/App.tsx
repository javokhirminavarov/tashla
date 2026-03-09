import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { HashRouter, Routes, Route } from "react-router-dom";
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
import type { HabitProfile } from "./lib/types";

export default function App() {
  const { t } = useTranslation();
  const { user, profiles, loading, error, refreshProfiles, setProfiles } =
    useAuth();

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
        <div className="text-center">
          <div className="animate-pulse space-y-4 w-48">
            <div className="h-10 bg-white/10 rounded-xl mx-auto w-10" />
            <div className="h-4 bg-white/10 rounded-lg w-3/4 mx-auto" />
            <p className="text-[#5C716A] text-xs mt-4">{t("common.loading")}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#122017] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-[#EF4444] mb-2 font-medium">{t("common.error")}</p>
          <p className="text-sm text-[#94A3A1] mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 min-h-[44px] rounded-full bg-[#1fc762] text-[#0d1a12] text-sm font-semibold active:scale-[0.97] transition-transform"
          >
            {t("common.retry") || "Qayta urinish"}
          </button>
        </div>
      </div>
    );
  }

  // No profiles → onboarding
  if (!profiles || profiles.length === 0) {
    return (
      <Onboarding
        onComplete={(newProfiles: HabitProfile[]) => setProfiles(newProfiles)}
      />
    );
  }

  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard profiles={profiles} />} />
          <Route path="/stats" element={<Stats profiles={profiles} />} />
          <Route path="/health" element={<Health profiles={profiles} />} />
          <Route path="/community" element={<Community />} />
          <Route path="/community/:id" element={<GroupDetail />} />
          <Route
            path="/profile"
            element={
              <Profile
                user={user!}
                profiles={profiles}
                refreshProfiles={refreshProfiles}
              />
            }
          />
        </Route>
      </Routes>
    </HashRouter>
  );
}
