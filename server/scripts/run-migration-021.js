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

  try {
    const sql = readFileSync(
      join(__dirname, "../database/021_seed_c_programming_and_jobs.sql"),
      "utf8"
    );

    console.log("Running migration 021: C programming course and job...");
    await pool.query(sql);

    const course = await pool.query(
      `SELECT c.title, COUNT(l.id)::int AS lessons
       FROM courses c
       LEFT JOIN course_sections s ON s.course_id = c.id
       LEFT JOIN course_lessons l ON l.section_id = s.id
       WHERE c.slug = 'c-programming-fundamentals'
       GROUP BY c.id`
    );
    const job = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM jobs
       WHERE title = 'Embedded C Developer Intern'
         AND company_name = 'CareerCraft Demo Partner'`
    );

    console.log(
      `Migration 021 complete. C course lessons: ${course.rows[0]?.lessons ?? 0}; C demo jobs: ${job.rows[0].count}.`
    );
  } finally {
    await pool.end();
  }
}

runMigration().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
