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
    join(__dirname, "../database/020_create_career_recommendations.sql"),
    "utf8"
  );
  console.log("Running migration 020: career recommendations...");
  await pool.query(sql);
  console.log("Migration 020 complete. Checking seeded career paths...");
  const res = await pool.query("SELECT COUNT(*)::int as count FROM career_paths");
  console.log(`Seeded career paths count: ${res.rows[0].count}`);
  await pool.end();
}

runMigration().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
