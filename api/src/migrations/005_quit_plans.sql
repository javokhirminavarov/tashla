CREATE TABLE IF NOT EXISTS quit_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  habit_type TEXT NOT NULL,
  start_limit INTEGER NOT NULL,
  target_limit INTEGER DEFAULT 0,
  reduction_percent INTEGER DEFAULT 15,
  step_duration_days INTEGER DEFAULT 7,
  current_step INTEGER DEFAULT 1,
  is_active INTEGER DEFAULT 1,
  started_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, habit_type)
);

CREATE TABLE IF NOT EXISTS quit_plan_steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER NOT NULL REFERENCES quit_plans(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  daily_limit INTEGER NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  status TEXT DEFAULT 'upcoming'
);
