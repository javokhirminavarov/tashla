import { tg } from "./telegram";
import type {
  AuthResponse,
  HabitProfile,
  TodayCounts,
  DailyEntry,
  HealthData,
  MoneySaved,
  HabitType,
  QuitPlan,
  Group,
  GroupDetail,
} from "./types";

const API_URL = import.meta.env.VITE_API_URL || "";

async function apiCall<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Telegram-Init-Data": tg.initData,
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error: ${res.status}`);
  }
  const json = await res.json();
  return json.data;
}

export const api = {
  auth(): Promise<AuthResponse> {
    return apiCall("/api/auth", {
      method: "POST",
      body: JSON.stringify({ initData: tg.initData }),
    });
  },

  getProfiles(): Promise<HabitProfile[]> {
    return apiCall("/api/profiles");
  },

  createProfile(data: {
    habit_type: HabitType;
    daily_baseline: number;
    daily_limit?: number;
    cost_per_unit?: number;
    target_quit_date?: string;
  }): Promise<HabitProfile> {
    return apiCall("/api/profiles", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  deleteProfile(habitType: HabitType): Promise<{ success: boolean }> {
    return apiCall(`/api/profiles/${habitType}`, { method: "DELETE" });
  },

  logUsage(
    habit_type: HabitType,
    quantity?: number
  ): Promise<{ today_count: number }> {
    return apiCall("/api/logs", {
      method: "POST",
      body: JSON.stringify({ habit_type, quantity }),
    });
  },

  undoLog(habit_type: HabitType): Promise<{ success: boolean }> {
    return apiCall("/api/logs/last", {
      method: "DELETE",
      body: JSON.stringify({ habit_type }),
    });
  },

  getTodayCounts(): Promise<TodayCounts> {
    return apiCall("/api/logs/today");
  },

  getDailyLogs(days: number = 7): Promise<DailyEntry[]> {
    return apiCall(`/api/logs/daily?days=${days}`);
  },

  getHealth(habitType: HabitType): Promise<HealthData> {
    return apiCall(`/api/health/${habitType}`);
  },

  getMoneySaved(): Promise<MoneySaved> {
    return apiCall("/api/stats/money");
  },

  getStreaks(): Promise<Record<string, number>> {
    return apiCall("/api/stats/streak");
  },

  updateLanguage(language: string): Promise<{ success: boolean }> {
    return apiCall("/api/profiles/me", {
      method: "PATCH",
      body: JSON.stringify({ language }),
    });
  },

  getQuitPlans(): Promise<QuitPlan[]> {
    return apiCall("/api/quit-plan");
  },

  getQuitPlan(habitType: HabitType): Promise<QuitPlan | null> {
    return apiCall(`/api/quit-plan/${habitType}`);
  },

  createQuitPlan(data: {
    habit_type: HabitType;
    start_limit: number;
    target_limit?: number;
    reduction_percent?: number;
    step_duration_days?: number;
  }): Promise<QuitPlan> {
    return apiCall("/api/quit-plan", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  deleteQuitPlan(habitType: HabitType): Promise<{ success: boolean }> {
    return apiCall(`/api/quit-plan/${habitType}`, { method: "DELETE" });
  },

  adjustQuitPlan(habitType: HabitType, direction: "faster" | "slower"): Promise<{ success: boolean; reduction_percent: number }> {
    return apiCall(`/api/quit-plan/${habitType}/adjust`, {
      method: "POST",
      body: JSON.stringify({ direction }),
    });
  },

  updateNotifications(data: {
    notifications_enabled?: boolean;
    notification_time?: string;
    weekly_summary?: boolean;
  }): Promise<{ success: boolean }> {
    return apiCall("/api/profiles/me/notifications", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  getGroups(): Promise<Group[]> {
    return apiCall("/api/groups");
  },

  getGroup(id: number): Promise<GroupDetail> {
    return apiCall(`/api/groups/${id}`);
  },

  createGroup(name: string): Promise<Group> {
    return apiCall("/api/groups", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  },

  joinGroup(inviteCode: string): Promise<{ group_id: number; name?: string }> {
    return apiCall("/api/groups/join", {
      method: "POST",
      body: JSON.stringify({ invite_code: inviteCode }),
    });
  },

  leaveGroup(id: number): Promise<{ success: boolean }> {
    return apiCall(`/api/groups/${id}/leave`, { method: "DELETE" });
  },

  toggleAlkogolPrivacy(groupId: number, hide: boolean): Promise<{ success: boolean }> {
    return apiCall(`/api/groups/${groupId}/privacy`, {
      method: "PATCH",
      body: JSON.stringify({ hide_alkogol: hide }),
    });
  },
};
