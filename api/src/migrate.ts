import "dotenv/config";
import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "migrations");

const DATABASE_URL = process.env.DATABASE_URL || "sqlite:tashla.db";
const isSQLite = DATABASE_URL.startsWith("sqlite:");

async function migrate() {
  if (isSQLite) {
    const Database = (await import("better-sqlite3")).default;
    const dbPath = DATABASE_URL.replace("sqlite:", "");
    const db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");

    db.exec(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        applied_at TEXT DEFAULT (datetime('now'))
      )
    `);

    const applied = new Set(
      (db.prepare("SELECT name FROM _migrations").all() as { name: string }[]).map(
        (r) => r.name
      )
    );

    const files = readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`  skip: ${file} (already applied)`);
        continue;
      }

      const sql = readFileSync(join(migrationsDir, file), "utf-8");
      console.log(`  applying: ${file}`);
      db.exec(sql);
      db.prepare("INSERT INTO _migrations (name) VALUES (?)").run(file);
    }

    db.close();
  } else {
    const { default: pg } = await import("pg");
    const pool = new pg.Pool({ connectionString: DATABASE_URL });

    // Drop all tables and recreate from scratch (no user data to preserve)
    console.log("  dropping all tables for fresh start...");
    await pool.query(`
      DROP TABLE IF EXISTS group_members CASCADE;
      DROP TABLE IF EXISTS groups CASCADE;
      DROP TABLE IF EXISTS quit_plan_steps CASCADE;
      DROP TABLE IF EXISTS quit_plans CASCADE;
      DROP TABLE IF EXISTS usage_logs CASCADE;
      DROP TABLE IF EXISTS habit_profiles CASCADE;
      DROP TABLE IF EXISTS health_milestones CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS _migrations CASCADE;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    const files = readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      let sql = readFileSync(join(migrationsDir, file), "utf-8");
      // Convert SQLite syntax to PostgreSQL
      sql = sql.replace(/INTEGER PRIMARY KEY AUTOINCREMENT/g, "SERIAL PRIMARY KEY");
      sql = sql.replace(/datetime\('now'\)/g, "NOW()");

      console.log(`  applying: ${file}`);
      await pool.query(sql);
      await pool.query("INSERT INTO _migrations (name) VALUES ($1)", [file]);
    }

    await pool.end();
  }

  console.log("Migrations complete!");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
