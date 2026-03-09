export type HabitType = "sigaret" | "nos" | "alkogol";

export interface User {
  id: number;
  telegram_id: number;
  first_name: string;
  username: string;
  language: string;
}

export interface HabitProfile {
  id: number;
  habit_type: HabitType;
  daily_baseline: number;
  daily_limit: number | null;
  cost_per_unit: number;
  target_quit_date: string | null;
  is_active: number | boolean;
  created_at: string;
}

export interface TodayCounts {
  [key: string]: number;
}

export interface DailyEntry {
  date: string;
  sigaret?: number;
  nos?: number;
  alkogol?: number;
}

export interface MilestoneData {
  id: number;
  hours_after: number;
  title_uz: string;
  description_uz: string;
  title_ru?: string;
  description_ru?: string;
  icon: string;
  unlocked: boolean;
  unlocked_ago?: string;
  time_until?: string;
}

export interface HealthData {
  last_log_at: string | null;
  hours_since: number;
  milestones: MilestoneData[];
}

export interface MoneySaved {
  today: Record<string, number>;
  total: Record<string, number>;
}

export interface AuthResponse {
  user: User;
  profiles: HabitProfile[];
}

export interface QuitPlanStep {
  id: number;
  plan_id: number;
  step_number: number;
  daily_limit: number;
  start_date: string;
  end_date: string;
  status: string;
}

export interface QuitPlan {
  id: number;
  user_id: number;
  habit_type: HabitType;
  start_limit: number;
  target_limit: number;
  reduction_percent: number;
  step_duration_days: number;
  current_step: number;
  is_active: number;
  started_at: string;
  steps: QuitPlanStep[];
}

export interface Group {
  id: number;
  name: string;
  invite_code: string;
  created_at: string;
  member_count: number;
}

export interface GroupMember {
  user_id: number;
  first_name: string;
  hide_alkogol: number;
  is_self: boolean;
  today: Record<string, number>;
  limits: Record<string, number>;
}

export interface GroupDetail {
  id: number;
  name: string;
  invite_code: string;
  created_at: string;
  members: GroupMember[];
}

export const HABIT_LABELS: Record<HabitType, string> = {
  sigaret: "Sigaret",
  nos: "Nos",
  alkogol: "Alkogol",
};

export const HABIT_ICONS: Record<HabitType, string> = {
  sigaret: "🚬",
  nos: "🟤",
  alkogol: "🍺",
};

export const HABIT_COLORS: Record<HabitType, string> = {
  sigaret: "#F97316",
  nos: "#8B5CF6",
  alkogol: "#3B82F6",
};

export const HABIT_UNITS: Record<HabitType, string> = {
  sigaret: "dona",
  nos: "dona",
  alkogol: "dona",
};
