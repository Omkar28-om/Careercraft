import dotenv from "dotenv";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const { Pool } = pg;

async function runMigration() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const sql = readFileSync(
    join(__dirname, "../database/019_create_user_preferences.sql"),
    "utf8"
  );
  console.log("Running migration 019: user_preferences...");
  await pool.query(sql);
  console.log("Migration 019 complete.");
  await pool.end();
}

runMigration().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
