CREATE TABLE IF NOT EXISTS users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id     INTEGER UNIQUE NOT NULL,
    first_name      TEXT,
    username        TEXT,
    language        TEXT DEFAULT 'uz',
    notifications_enabled INTEGER DEFAULT 1,
    notification_time TEXT DEFAULT '21:00',
    timezone        TEXT DEFAULT 'Asia/Tashkent',
    weekly_summary  INTEGER DEFAULT 1,
    created_at      TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS habit_profiles (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    habit_type      TEXT NOT NULL CHECK (habit_type IN ('sigaret', 'nos', 'alkogol')),
    daily_baseline  INTEGER NOT NULL,
    daily_limit     INTEGER,
    cost_per_unit   INTEGER DEFAULT 0,
    target_quit_date TEXT,
    is_active       INTEGER DEFAULT 1,
    created_at      TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, habit_type)
);

CREATE TABLE IF NOT EXISTS usage_logs (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    habit_type      TEXT NOT NULL,
    quantity        INTEGER DEFAULT 1,
    logged_at       TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_logs_lookup ON usage_logs(user_id, habit_type, logged_at DESC);

CREATE TABLE IF NOT EXISTS health_milestones (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_type      TEXT NOT NULL,
    hours_after     REAL NOT NULL,
    title_uz        TEXT NOT NULL,
    description_uz  TEXT NOT NULL,
    title_ru        TEXT,
    description_ru  TEXT,
    icon            TEXT DEFAULT '✅'
);

CREATE TABLE IF NOT EXISTS quit_plans (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    habit_type      TEXT NOT NULL,
    start_limit     INTEGER NOT NULL,
    target_limit    INTEGER DEFAULT 0,
    reduction_percent INTEGER DEFAULT 15,
    step_duration_days INTEGER DEFAULT 7,
    current_step    INTEGER DEFAULT 1,
    is_active       INTEGER DEFAULT 1,
    started_at      TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, habit_type)
);

CREATE TABLE IF NOT EXISTS quit_plan_steps (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id         INTEGER NOT NULL REFERENCES quit_plans(id) ON DELETE CASCADE,
    step_number     INTEGER NOT NULL,
    daily_limit     INTEGER NOT NULL,
    start_date      TEXT NOT NULL,
    end_date        TEXT NOT NULL,
    status          TEXT DEFAULT 'upcoming'
);

CREATE TABLE IF NOT EXISTS groups (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,
    invite_code     TEXT UNIQUE NOT NULL,
    created_by      INTEGER REFERENCES users(id),
    created_at      TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS group_members (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id        INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hide_alkogol    INTEGER DEFAULT 1,
    joined_at       TEXT DEFAULT (datetime('now')),
    UNIQUE(group_id, user_id)
);
