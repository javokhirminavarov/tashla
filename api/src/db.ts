import "dotenv/config";

interface QueryResult {
  rows: Record<string, unknown>[];
  rowCount: number;
}

const DATABASE_URL = process.env.DATABASE_URL || "sqlite:tashla.db";
const isSQLite = DATABASE_URL.startsWith("sqlite:");

function convertParams(sql: string): string {
  if (!isSQLite) return sql;
  let idx = 0;
  // Replace $1, $2, ... with ?
  let converted = sql.replace(/\$\d+/g, () => {
    idx++;
    return "?";
  });
  // Strip ::int, ::date, ::text casts
  converted = converted.replace(/::\w+/g, "");
  // Replace CURRENT_DATE with date('now')
  converted = converted.replace(/\bCURRENT_DATE\b/g, "date('now')");
  // Replace NOW() with datetime('now')
  converted = converted.replace(/\bNOW\(\)/gi, "datetime('now')");
  // Replace COALESCE usage — keep as-is (SQLite supports COALESCE)
  return converted;
}

let queryFn: (sql: string, params?: unknown[]) => Promise<QueryResult>;

// ── Schema SQL (SQLite dialect — converted for pg below) ─────────────
const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id     BIGINT UNIQUE NOT NULL,
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
`;

// ── Seed data (health milestones) ────────────────────────────────────
const SEED_SQL = `
INSERT OR IGNORE INTO health_milestones (habit_type, hours_after, title_uz, description_uz, title_ru, description_ru, icon) VALUES
('sigaret', 0.33, 'Qon bosimi normallashadi', 'Qon bosimi va yurak urishi normallashadi', 'Давление нормализуется', 'Артериальное давление и пульс приходят в норму', '❤️'),
('sigaret', 8, 'Kislorod darajasi tiklanadi', 'Qondagi kislorod darajasi normallashadi', 'Уровень кислорода восстанавливается', 'Уровень кислорода в крови нормализуется', '🫁'),
('sigaret', 24, 'Yurak xavfi kamayadi', 'Yurak xurujiga uchrash xavfi kamaya boshlaydi', 'Риск инфаркта снижается', 'Риск сердечного приступа начинает снижаться', '💓'),
('sigaret', 48, 'Sezgi organlari tiklanadi', 'Ta''m va hid sezish yaxshilanadi', 'Вкус и обоняние восстанавливаются', 'Улучшается восприятие вкуса и запаха', '👃'),
('sigaret', 72, 'Nafas olish osonlashadi', 'Nafas olish osonlashadi, bronxlar bo''shashadi', 'Дыхание облегчается', 'Дыхание облегчается, бронхи расслабляются', '🌬️'),
('sigaret', 720, 'Teri holati yaxshilanadi', 'Teri rangi va elastikligi yaxshilanadi', 'Кожа улучшается', 'Улучшается цвет и эластичность кожи', '✨'),
('sigaret', 2160, 'O''pka ishlashi yaxshilanadi', 'O''pka ishlashi 30% gacha yaxshilanadi', 'Работа лёгких улучшается', 'Функция лёгких улучшается до 30%', '🫁'),
('sigaret', 8760, 'Yurak kasalligi xavfi kamayadi', 'Yurak kasalligi xavfi 50% kamayadi', 'Риск болезней сердца снижается', 'Риск сердечных заболеваний снижается на 50%', '❤️‍🩹'),
('sigaret', 43800, 'Insult xavfi yo''qoladi', 'Insult xavfi chekmaydigan odamnikidek bo''ladi', 'Риск инсульта устранён', 'Риск инсульта сравнивается с некурящим человеком', '🏆'),
('nos', 24, 'Og''iz tiklana boshlaydi', 'Og''iz shilliq qavatini tiklash boshlanadi', 'Полость рта восстанавливается', 'Начинается восстановление слизистой рта', '👄'),
('nos', 72, 'Jarohatlar bitadi', 'Og''izdagi yara va jarohatlar bita boshlaydi', 'Раны заживают', 'Раны и повреждения во рту начинают заживать', '🩹'),
('nos', 168, 'Tish miltigi tiklanadi', 'Tish miltigi yallig''lanishi sezilarli kamayadi', 'Дёсны восстанавливаются', 'Воспаление дёсен заметно уменьшается', '🦷'),
('nos', 720, 'Og''iz to''liq tiklanadi', 'Og''iz bo''shlig''i to''liq tiklanadi', 'Полное восстановление рта', 'Полость рта полностью восстанавливается', '😊'),
('nos', 2160, 'Saraton xavfi kamayadi', 'Og''iz bo''shlig''i saraton xavfi kamaya boshlaydi', 'Риск рака снижается', 'Риск рака полости рта начинает снижаться', '🛡️'),
('nos', 8760, 'Oshqozon holati yaxshilanadi', 'Oshqozon va qizilo''ngach holati yaxshilanadi', 'Пищеварение улучшается', 'Улучшается состояние желудка и пищевода', '🏆'),
('alkogol', 24, 'Qon shakari normallashadi', 'Qondagi shakar darajasi normallashadi', 'Сахар в крови нормализуется', 'Уровень сахара в крови нормализуется', '🩸'),
('alkogol', 72, 'Detoksifikatsiya tugaydi', 'Detoksifikatsiya jarayoni tugaydi', 'Детоксикация завершена', 'Процесс детоксикации завершается', '🧹'),
('alkogol', 168, 'Uyqu yaxshilanadi', 'Uyqu sifati sezilarli yaxshilanadi', 'Сон улучшается', 'Качество сна заметно улучшается', '😴'),
('alkogol', 720, 'Jigar tiklana boshlaydi', 'Jigar yog''lanishi kamaya boshlaydi', 'Печень восстанавливается', 'Начинается уменьшение ожирения печени', '🫀'),
('alkogol', 2160, 'Qon bosimi normallashadi', 'Qon bosimi normallashadi', 'Давление нормализуется', 'Артериальное давление нормализуется', '💓'),
('alkogol', 4380, 'Jigar hujayralari tiklanadi', 'Jigar hujayralari tiklanadi', 'Клетки печени восстанавливаются', 'Клетки печени восстанавливаются', '🫀'),
('alkogol', 8760, 'Jigar kasalligi xavfi kamayadi', 'Jigar kasalligi xavfi sezilarli kamayadi', 'Риск болезней печени снижается', 'Риск заболеваний печени заметно снижается', '🏆');
`;

function convertSchemaToPg(sql: string): string {
  return sql
    .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/g, "SERIAL PRIMARY KEY")
    .replace(/datetime\('now'\)/g, "NOW()")
    .replace(/\bTEXT\b/g, "TEXT")
    .replace(/\bREAL\b/g, "DOUBLE PRECISION");
}

if (isSQLite) {
  const Database = (await import("better-sqlite3")).default;
  const dbPath = DATABASE_URL.replace("sqlite:", "");
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // Create tables + seed on startup
  db.exec(SCHEMA_SQL);
  db.exec(SEED_SQL);

  queryFn = async (sql: string, params?: unknown[]): Promise<QueryResult> => {
    const converted = convertParams(sql);
    const trimmed = converted.trim().toUpperCase();

    if (
      trimmed.startsWith("SELECT") ||
      trimmed.startsWith("WITH") ||
      trimmed.startsWith("RETURNING")
    ) {
      const rows = db.prepare(converted).all(...(params || [])) as Record<
        string,
        unknown
      >[];
      return { rows, rowCount: rows.length };
    }

    // For INSERT/UPDATE/DELETE that have RETURNING clause
    if (/\bRETURNING\b/i.test(converted)) {
      const rows = db.prepare(converted).all(...(params || [])) as Record<
        string,
        unknown
      >[];
      return { rows, rowCount: rows.length };
    }

    const result = db.prepare(converted).run(...(params || []));
    return { rows: [], rowCount: result.changes };
  };

  (globalThis as Record<string, unknown>).__sqliteDb = db;
  console.log("SQLite database initialized with schema");
} else {
  const { default: pg } = await import("pg");
  const pool = new pg.Pool({ connectionString: DATABASE_URL });

  // Create tables + seed on startup
  const pgSchema = convertSchemaToPg(SCHEMA_SQL);
  await pool.query(pgSchema);

  // Seed milestones — convert SQLite "INSERT OR IGNORE" to pg "ON CONFLICT DO NOTHING"
  const pgSeed = SEED_SQL
    .replace("INSERT OR IGNORE INTO", "INSERT INTO")
    .replace(/;\s*$/, " ON CONFLICT DO NOTHING;");
  try {
    await pool.query(pgSeed);
  } catch {
    console.log("Seed data: some rows may already exist, skipping");
  }

  // Ensure telegram_id is BIGINT for large Telegram IDs (CREATE TABLE IF NOT EXISTS won't alter existing columns)
  try {
    await pool.query("ALTER TABLE users ALTER COLUMN telegram_id TYPE BIGINT;");
  } catch {
    // Already BIGINT or table just created with correct type — safe to ignore
  }

  console.log("PostgreSQL database initialized with schema");

  queryFn = async (sql: string, params?: unknown[]): Promise<QueryResult> => {
    const result = await pool.query(sql, params);
    return { rows: result.rows, rowCount: result.rowCount ?? 0 };
  };
}

export const query = queryFn;
export { isSQLite };
