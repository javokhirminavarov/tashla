CREATE TABLE IF NOT EXISTS users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id     INTEGER UNIQUE NOT NULL,
    first_name      TEXT,
    username        TEXT,
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
    icon            TEXT DEFAULT '✅'
);
