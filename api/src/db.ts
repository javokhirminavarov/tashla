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

if (isSQLite) {
  const Database = (await import("better-sqlite3")).default;
  const dbPath = DATABASE_URL.replace("sqlite:", "");
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

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

  // Expose raw db for migrations
  (globalThis as Record<string, unknown>).__sqliteDb = db;
} else {
  const { default: pg } = await import("pg");
  const pool = new pg.Pool({ connectionString: DATABASE_URL });

  queryFn = async (sql: string, params?: unknown[]): Promise<QueryResult> => {
    const result = await pool.query(sql, params);
    return { rows: result.rows, rowCount: result.rowCount ?? 0 };
  };
}

export const query = queryFn;
export { isSQLite };
