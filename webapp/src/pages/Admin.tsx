import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { api } from "../lib/api";
import type {
  AdminOverview,
  AdminUser,
  AdminUserDetail,
  AdminHabitStats,
  AdminActivity,
  HabitType,
} from "../lib/types";
import { HABIT_COLORS, HABIT_LABELS, HABIT_MATERIAL_ICONS } from "../lib/types";

/* ───────────────────────── helpers ───────────────────────── */

function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

function formatShortDate(dateStr: string): string {
  const parts = dateStr.split("-");
  const d = new Date(
    Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
  );
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/* ───────────────────────── skeleton ─────────────────────── */

function OverviewSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-[#1a2c22] rounded-2xl p-5 border border-white/[0.06] animate-pulse"
        >
          <div className="h-5 w-5 bg-white/5 rounded-lg mb-3" />
          <div className="h-8 bg-white/5 rounded-lg w-2/3 mb-2" />
          <div className="h-3 bg-white/5 rounded-lg w-1/2" />
        </div>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="bg-[#1a2c22] rounded-2xl p-5 border border-white/[0.06] animate-pulse">
      <div className="h-4 bg-white/5 rounded-lg w-1/3 mb-4" />
      <div className="h-[200px] bg-white/5 rounded-xl" />
    </div>
  );
}

function HabitsSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="bg-[#1a2c22] rounded-2xl p-5 border border-white/[0.06] animate-pulse"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-white/5" />
            <div className="h-4 bg-white/5 rounded-lg w-24" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="h-12 bg-white/5 rounded-xl" />
            <div className="h-12 bg-white/5 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

function UsersSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-[#1a2c22] rounded-2xl p-5 border border-white/[0.06] animate-pulse"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/5" />
            <div className="flex-1">
              <div className="h-4 bg-white/5 rounded-lg w-1/2 mb-2" />
              <div className="h-3 bg-white/5 rounded-lg w-1/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ───────────────────── stat card ─────────────────────────── */

interface StatCardProps {
  icon: string;
  value: number;
  label: string;
  delay: number;
}

function StatCard({ icon, value, label, delay }: StatCardProps) {
  return (
    <div
      className="bg-[#1a2c22] rounded-2xl p-5 border border-white/[0.06]"
      style={{
        animation: `fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms both`,
      }}
    >
      <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#1fc762]/10 mb-3">
        <span className="material-symbols-outlined text-[20px] text-[#1fc762]">
          {icon}
        </span>
      </div>
      <p className="text-3xl font-light tracking-tight text-[#F1F5F2]">
        {formatNumber(value)}
      </p>
      <p className="text-xs font-medium tracking-wide uppercase text-[#5C716A] mt-1">
        {label}
      </p>
    </div>
  );
}

/* ───────────────── activity chart ────────────────────────── */

interface ActivityChartProps {
  data: AdminActivity[];
}

function ActivityChart({ data }: ActivityChartProps) {
  return (
    <div
      className="bg-[#1a2c22] rounded-2xl p-5 border border-white/[0.06]"
      style={{
        animation: "fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 320ms both",
      }}
    >
      <h2 className="text-lg font-semibold text-[#F1F5F2] mb-4">
        Activity (30 days)
      </h2>
      <div style={{ width: "100%", minHeight: 200 }}>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="brand-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1fc762" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#1fc762" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="secondary-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#94A3A1" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#94A3A1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              tickFormatter={formatShortDate}
              interval={6}
              stroke="#5C716A"
              fontSize={11}
              fontFamily="Lexend"
              tickLine={false}
              axisLine={false}
            />
            <YAxis hide domain={[0, "auto"]} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#23352b",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "12px",
                fontSize: "12px",
                fontFamily: "Lexend",
                color: "#F1F5F2",
                padding: "8px 12px",
              }}
              labelFormatter={(label) => formatShortDate(String(label))}
            />
            <Area
              type="monotone"
              dataKey="active_users"
              name="Active Users"
              stroke="#1fc762"
              strokeWidth={2.5}
              fill="url(#brand-fill)"
              dot={false}
              activeDot={{ r: 4, fill: "#1fc762", stroke: "#1a2c22", strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="log_count"
              name="Logs"
              stroke="#94A3A1"
              strokeWidth={2}
              fill="url(#secondary-fill)"
              dot={false}
              activeDot={{ r: 4, fill: "#94A3A1", stroke: "#1a2c22", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ─────────────── habit stats card ────────────────────────── */

interface HabitCardProps {
  stat: AdminHabitStats;
  delay: number;
}

function HabitStatCard({ stat, delay }: HabitCardProps) {
  const ht = stat.habit_type;
  const color = HABIT_COLORS[ht];
  const icon = HABIT_MATERIAL_ICONS[ht];
  const label = HABIT_LABELS[ht];

  return (
    <div
      className="bg-[#1a2c22] rounded-2xl p-5 border border-white/[0.06]"
      style={{
        borderColor: `${color}26`,
        animation: `fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms both`,
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-full"
          style={{ backgroundColor: `${color}20`, color }}
        >
          <span className="material-symbols-outlined text-[22px]">{icon}</span>
        </div>
        <h3 className="text-base font-medium text-[#F1F5F2]">{label}</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#0d1a12] rounded-xl p-3">
          <p className="text-xl font-light tracking-tight text-[#F1F5F2]">
            {formatNumber(stat.user_count)}
          </p>
          <p className="text-xs font-medium tracking-wide uppercase text-[#5C716A] mt-0.5">
            Users
          </p>
        </div>
        <div className="bg-[#0d1a12] rounded-xl p-3">
          <p className="text-xl font-light tracking-tight text-[#F1F5F2]">
            {stat.avg_baseline.toFixed(1)}
          </p>
          <p className="text-xs font-medium tracking-wide uppercase text-[#5C716A] mt-0.5">
            Avg Baseline
          </p>
        </div>
        <div className="bg-[#0d1a12] rounded-xl p-3">
          <p className="text-xl font-light tracking-tight text-[#F1F5F2]">
            {formatNumber(stat.total_logs)}
          </p>
          <p className="text-xs font-medium tracking-wide uppercase text-[#5C716A] mt-0.5">
            Total Logs
          </p>
        </div>
        <div className="bg-[#0d1a12] rounded-xl p-3">
          <p className="text-xl font-light tracking-tight text-[#F1F5F2]">
            {formatNumber(stat.total_quantity)}
          </p>
          <p className="text-xs font-medium tracking-wide uppercase text-[#5C716A] mt-0.5">
            Total Qty
          </p>
        </div>
      </div>
    </div>
  );
}

/* ──────────────── user detail panel ──────────────────────── */

interface UserDetailPanelProps {
  detail: AdminUserDetail;
}

function UserDetailPanel({ detail }: UserDetailPanelProps) {
  const { user, profiles, recentLogs } = detail;

  return (
    <div
      className="mt-3 pt-3 border-t border-white/[0.04] space-y-3"
      style={{
        animation: "fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both",
      }}
    >
      {/* User meta */}
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0d1a12] text-xs text-[#94A3A1]">
          <span className="material-symbols-outlined text-[14px]">language</span>
          {user.language.toUpperCase()}
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0d1a12] text-xs text-[#94A3A1]">
          <span className="material-symbols-outlined text-[14px]">notifications</span>
          {user.notifications_enabled ? "On" : "Off"}
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0d1a12] text-xs text-[#94A3A1]">
          <span className="material-symbols-outlined text-[14px]">schedule</span>
          {user.notification_time || "—"}
        </span>
      </div>

      {/* Profiles */}
      {profiles.length > 0 && (
        <div>
          <p className="text-xs font-medium tracking-wide uppercase text-[#5C716A] mb-2">
            Profiles
          </p>
          <div className="flex flex-wrap gap-2">
            {profiles.map((p) => {
              const color = HABIT_COLORS[p.habit_type as HabitType];
              return (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: `${color}15`,
                    color,
                    border: `1px solid ${color}25`,
                  }}
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {HABIT_MATERIAL_ICONS[p.habit_type as HabitType]}
                  </span>
                  {p.daily_baseline}/{p.daily_limit ?? "—"} · {formatNumber(p.cost_per_unit)} so'm
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent logs */}
      {recentLogs.length > 0 && (
        <div>
          <p className="text-xs font-medium tracking-wide uppercase text-[#5C716A] mb-2">
            Recent Logs
          </p>
          <div className="space-y-1.5">
            {recentLogs.slice(0, 5).map((log) => {
              const color = HABIT_COLORS[log.habit_type as HabitType] || "#94A3A1";
              const logDate = new Date(log.logged_at);
              const timeStr = `${String(logDate.getHours()).padStart(2, "0")}:${String(logDate.getMinutes()).padStart(2, "0")}`;
              return (
                <div
                  key={log.id}
                  className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-[#0d1a12]"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="material-symbols-outlined text-[16px]"
                      style={{ color }}
                    >
                      {HABIT_MATERIAL_ICONS[log.habit_type as HabitType] || "circle"}
                    </span>
                    <span className="text-xs text-[#F1F5F2]">
                      {HABIT_LABELS[log.habit_type as HabitType] || log.habit_type}
                    </span>
                    <span className="text-xs text-[#5C716A]">x{log.quantity}</span>
                  </div>
                  <span className="text-xs text-[#5C716A]">
                    {formatShortDate(log.logged_at.split("T")[0])} {timeStr}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ──────────────── user row ───────────────────────────────── */

interface UserRowProps {
  user: AdminUser;
  isExpanded: boolean;
  onToggle: () => void;
  detail: AdminUserDetail | null;
  detailLoading: boolean;
}

function UserRow({ user, isExpanded, onToggle, detail, detailLoading }: UserRowProps) {
  const initial = user.first_name?.charAt(0)?.toUpperCase() || "?";

  return (
    <div
      className={`bg-[#1a2c22] rounded-2xl border transition-colors duration-150 ${
        isExpanded
          ? "border-[#1fc762]/20"
          : "border-white/[0.06]"
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left active:scale-[0.99] transition-transform duration-100"
      >
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-[#1fc762] to-[#17a34a] shrink-0">
          <span className="text-sm font-semibold text-[#0d1a12]">{initial}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#F1F5F2] truncate">
            {user.first_name}
          </p>
          <p className="text-xs text-[#5C716A] truncate">
            {user.username ? `@${user.username}` : `ID: ${user.telegram_id}`}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-xs text-[#94A3A1]">{formatNumber(user.log_count)} logs</p>
            <p className="text-xs text-[#5C716A]">{user.profile_count} habits</p>
          </div>
          <span
            className={`material-symbols-outlined text-[18px] text-[#5C716A] transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
          >
            expand_more
          </span>
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-[14px] text-[#5C716A]">
              calendar_today
            </span>
            <span className="text-xs text-[#5C716A]">
              Joined {formatFullDate(user.created_at)}
            </span>
          </div>

          {detailLoading ? (
            <div className="mt-3 pt-3 border-t border-white/[0.04] animate-pulse space-y-3">
              <div className="flex gap-2">
                <div className="h-6 w-16 bg-white/5 rounded-lg" />
                <div className="h-6 w-16 bg-white/5 rounded-lg" />
              </div>
              <div className="h-16 bg-white/5 rounded-xl" />
            </div>
          ) : detail ? (
            <UserDetailPanel detail={detail} />
          ) : null}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════ MAIN PAGE ═══════════════════════ */

export default function Admin() {
  const navigate = useNavigate();

  // data states
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [activity, setActivity] = useState<AdminActivity[]>([]);
  const [habits, setHabits] = useState<AdminHabitStats[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);

  // loading states
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [habitsLoading, setHabitsLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);

  // error
  const [error, setError] = useState<string | null>(null);

  // users section
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  // expanded user
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);
  const [userDetails, setUserDetails] = useState<Record<number, AdminUserDetail>>({});
  const [detailLoadingId, setDetailLoadingId] = useState<number | null>(null);

  // search debounce
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // refresh flag
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
  }, []);

  // Fetch overview
  useEffect(() => {
    setOverviewLoading(true);
    api
      .adminOverview()
      .then((data) => {
        setOverview(data);
        setError(null);
      })
      .catch((err) => {
        if (err.message?.includes("403")) {
          setError("Admin access required");
        } else {
          setError(err.message || "Failed to load admin data");
        }
      })
      .finally(() => setOverviewLoading(false));
  }, [refreshKey]);

  // Fetch activity
  useEffect(() => {
    setActivityLoading(true);
    api
      .adminActivity(30)
      .then(setActivity)
      .catch(() => {})
      .finally(() => setActivityLoading(false));
  }, [refreshKey]);

  // Fetch habits
  useEffect(() => {
    setHabitsLoading(true);
    api
      .adminHabits()
      .then(setHabits)
      .catch(() => {})
      .finally(() => setHabitsLoading(false));
  }, [refreshKey]);

  // Fetch users
  useEffect(() => {
    setUsersLoading(true);
    api
      .adminUsers(debouncedSearch, page, LIMIT)
      .then((res) => {
        setUsers(res.users);
        setUsersTotal(res.total);
      })
      .catch(() => {})
      .finally(() => setUsersLoading(false));
  }, [debouncedSearch, page, refreshKey]);

  // Fetch user detail on expand
  const handleToggleUser = useCallback(
    (userId: number) => {
      if (expandedUserId === userId) {
        setExpandedUserId(null);
        return;
      }
      setExpandedUserId(userId);
      if (!userDetails[userId]) {
        setDetailLoadingId(userId);
        api
          .adminUserDetail(userId)
          .then((detail) => {
            setUserDetails((prev) => ({ ...prev, [userId]: detail }));
          })
          .catch(() => {})
          .finally(() => setDetailLoadingId(null));
      }
    },
    [expandedUserId, userDetails]
  );

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
    setExpandedUserId(null);
    setUserDetails({});
  };

  const totalPages = Math.ceil(usersTotal / LIMIT);
  const newUsersToday =
    overview?.newUsersTrend && overview.newUsersTrend.length > 0
      ? overview.newUsersTrend[overview.newUsersTrend.length - 1].count
      : 0;

  // Error state
  if (error && !overview) {
    return (
      <div className="bg-[#122017] min-h-screen px-5 pt-4 pb-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate("/")}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 active:scale-[0.97] transition-transform duration-100"
          >
            <span className="material-symbols-outlined text-[20px] text-[#94A3A1]">
              arrow_back
            </span>
          </button>
          <h1 className="text-lg font-semibold text-[#F1F5F2]">Admin Dashboard</h1>
          <div className="w-10" />
        </header>

        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full mb-4 bg-[#EF4444]/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-[28px] text-[#EF4444]">
              {error === "Admin access required" ? "lock" : "error"}
            </span>
          </div>
          <p className="text-sm text-[#F1F5F2] mb-1 font-medium">{error}</p>
          <p className="text-xs text-[#5C716A] mb-4">
            {error === "Admin access required"
              ? "You don't have permission to view this page."
              : "Something went wrong. Please try again."}
          </p>
          <button
            onClick={handleRefresh}
            className="min-h-[44px] px-6 rounded-xl bg-[#1fc762]/15 text-[#1fc762] text-sm font-semibold active:scale-[0.97] transition-transform duration-100"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#122017] min-h-screen px-5 pt-4 pb-8">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate("/")}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 active:scale-[0.97] transition-transform duration-100"
        >
          <span className="material-symbols-outlined text-[20px] text-[#94A3A1]">
            arrow_back
          </span>
        </button>
        <h1 className="text-lg font-semibold text-[#F1F5F2]">Admin Dashboard</h1>
        <button
          onClick={handleRefresh}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 active:scale-[0.97] transition-transform duration-100"
        >
          <span className="material-symbols-outlined text-[20px] text-[#94A3A1]">
            refresh
          </span>
        </button>
      </header>

      <div className="space-y-6">
        {/* ─── Section 1: Overview Stats ─── */}
        {overviewLoading ? (
          <OverviewSkeleton />
        ) : overview ? (
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              icon="group"
              value={overview.totalUsers}
              label="Total Users"
              delay={0}
            />
            <StatCard
              icon="trending_up"
              value={overview.activeUsers}
              label="Active (7d)"
              delay={80}
            />
            <StatCard
              icon="edit_note"
              value={overview.totalLogs}
              label="Total Logs"
              delay={160}
            />
            <StatCard
              icon="person_add"
              value={newUsersToday}
              label="New Today"
              delay={240}
            />
          </div>
        ) : null}

        {/* ─── Section 2: Activity Chart ─── */}
        {activityLoading ? (
          <ChartSkeleton />
        ) : activity.length > 0 ? (
          <ActivityChart data={activity} />
        ) : (
          <div className="bg-[#1a2c22] rounded-2xl p-5 border border-white/[0.06]">
            <h2 className="text-lg font-semibold text-[#F1F5F2] mb-4">
              Activity (30 days)
            </h2>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <span className="material-symbols-outlined text-[28px] text-[#5C716A] mb-2">
                show_chart
              </span>
              <p className="text-xs text-[#5C716A]">No activity data yet</p>
            </div>
          </div>
        )}

        {/* ─── Section 3: Habit Stats ─── */}
        <div>
          <h2 className="text-lg font-semibold text-[#F1F5F2] mb-4">
            Habits Overview
          </h2>
          {habitsLoading ? (
            <HabitsSkeleton />
          ) : habits.length > 0 ? (
            <div className="space-y-4">
              {habits.map((stat, i) => (
                <HabitStatCard key={stat.habit_type} stat={stat} delay={400 + i * 80} />
              ))}
            </div>
          ) : (
            <div className="bg-[#1a2c22] rounded-2xl p-5 border border-white/[0.06]">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <span className="material-symbols-outlined text-[28px] text-[#5C716A] mb-2">
                  analytics
                </span>
                <p className="text-xs text-[#5C716A]">No habit data yet</p>
              </div>
            </div>
          )}
        </div>

        {/* ─── Section 4: Users List ─── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#F1F5F2]">Users</h2>
            <span className="text-xs font-medium tracking-wide text-[#5C716A]">
              {formatNumber(usersTotal)} total
            </span>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-[#5C716A]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by name or username..."
              className="w-full bg-[#0d1a12] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-[#F1F5F2] placeholder:text-[#5C716A] focus:outline-none focus:border-[#1fc762]/40 transition-colors duration-150"
            />
          </div>

          {/* User list */}
          {usersLoading ? (
            <UsersSkeleton />
          ) : users.length > 0 ? (
            <div className="space-y-3">
              {users.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  isExpanded={expandedUserId === user.id}
                  onToggle={() => handleToggleUser(user.id)}
                  detail={userDetails[user.id] || null}
                  detailLoading={detailLoadingId === user.id}
                />
              ))}
            </div>
          ) : (
            <div className="bg-[#1a2c22] rounded-2xl p-5 border border-white/[0.06]">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <span className="material-symbols-outlined text-[28px] text-[#5C716A] mb-2">
                  person_off
                </span>
                <p className="text-sm text-[#94A3A1] mb-1">No users found</p>
                {debouncedSearch && (
                  <p className="text-xs text-[#5C716A]">
                    Try a different search term
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`flex items-center gap-1 min-h-[44px] px-4 rounded-xl text-sm font-medium active:scale-[0.97] transition-all duration-150 ${
                  page === 1
                    ? "bg-white/5 text-[#5C716A] cursor-not-allowed"
                    : "bg-white/5 text-[#94A3A1]"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  chevron_left
                </span>
                Prev
              </button>

              <span className="text-xs font-medium text-[#5C716A]">
                {page} / {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={`flex items-center gap-1 min-h-[44px] px-4 rounded-xl text-sm font-medium active:scale-[0.97] transition-all duration-150 ${
                  page === totalPages
                    ? "bg-white/5 text-[#5C716A] cursor-not-allowed"
                    : "bg-white/5 text-[#94A3A1]"
                }`}
              >
                Next
                <span className="material-symbols-outlined text-[18px]">
                  chevron_right
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
