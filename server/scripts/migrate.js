import dotenv from "dotenv";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const here = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(here, "../.env") });

export async function runMigrations(existingPool = null) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to run migrations.");
  }

  const pool = existingPool || new pg.Pool({
    connectionString,
    ssl: (connectionString.includes("sslmode=require") || process.env.NODE_ENV === "production")
      ? { rejectUnauthorized: false }
      : undefined,
  });

  const shouldClosePool = !existingPool;

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    // If this database already has core tables from earlier setups before
    // schema_migrations tracking was introduced, record them so that duplicate
    // CREATE TABLE statements are not executed.
    const usersCheck = await pool.query(`
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    `);

    if (usersCheck.rowCount > 0) {
      const historicalMigrations = [
        "001_create_users.sql",
        "002_create_profiles.sql",
        "003_create_skills.sql",
        "004_update_skills.sql",
        "005_create_student_progress.sql",
        "006_create_user_activity.sql",
        "007_create_achievements.sql",
        "008_create_coding_problems.sql",
        "009_seed_coding_problems.sql",
        "010_create_projects.sql",
        "011_create_courses.sql",
        "012_seed_courses.sql",
        "013_create_jobs.sql",
        "014_seed_jobs.sql",
        "015_create_freelancing.sql",
        "016_seed_freelance.sql",
        "017_create_notifications.sql",
        "018_create_admin_audit_logs.sql",
        "019_create_user_preferences.sql",
        "020_create_career_recommendations.sql",
      ];

      for (const histName of historicalMigrations) {
        await pool.query(
          "INSERT INTO schema_migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING",
          [histName]
        );
      }
    }

    const files = (await readdir(join(here, "../database")))
      .filter((name) => /^\d{3}_.+\.sql$/.test(name))
      .sort();

    for (const name of files) {
      const alreadyApplied = await pool.query(
        "SELECT 1 FROM schema_migrations WHERE name = $1",
        [name],
      );
      if (alreadyApplied.rowCount) continue;

      const sql = await readFile(join(here, "../database", name), "utf8");
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [name]);
        await client.query("COMMIT");
        console.log(`Applied ${name}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw new Error(`Migration ${name} failed: ${error.message}`, { cause: error });
      } finally {
        client.release();
      }
    }
    console.log("Database migrations are up to date.");
  } finally {
    if (shouldClosePool) {
      await pool.end();
    }
  }
}

// Auto-run if executed directly as a script (e.g. node scripts/migrate.js)
const isMainScript = process.argv[1] && (
  fileURLToPath(import.meta.url) === process.argv[1] ||
  process.argv[1].endsWith("migrate.js")
);

if (isMainScript) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Migration error:", err.message);
      process.exit(1);
    });
}
