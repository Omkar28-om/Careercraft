/**
 * CareerCraft — Secure Admin Creation Utility
 *
 * Secure CLI tool to create an administrator account using the
 * existing authentication architecture and bcrypt password hashing.
 *
 * Usage:
 *   node scripts/create-admin.js "Admin Name" "admin@example.com" "SecurePassword123!"
 *   or:
 *   npm run admin:create -- "Admin Name" "admin@example.com" "SecurePassword123!"
 *
 * Security:
 *   - Runs server-side CLI only; never exposed as a public API endpoint.
 *   - Uses the exact same bcryptjs hashing (12 salt rounds) and database validation
 *     as the production authentication controller.
 *   - Never prints passwords or password hashes.
 *   - Does not modify or overwrite existing users.
 */

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import pg from "pg";
import bcrypt from "bcryptjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const { Pool } = pg;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function createAdmin(name, email, password) {
  if (!name || !email || !password) {
    console.error("\nUsage: node scripts/create-admin.js \"Full Name\" user@example.com \"Password123!\"\n");
    console.error("Alternatively, promote an existing account with:\n  npm run admin:promote user@example.com\n");
    process.exit(1);
  }

  const trimmedName = typeof name === "string" ? name.trim() : "";
  const trimmedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!trimmedName || trimmedName.length > 100) {
    console.error("\nError: Name must be between 1 and 100 characters.\n");
    process.exit(1);
  }

  if (!EMAIL_REGEX.test(trimmedEmail) || trimmedEmail.length > 255) {
    console.error(`\nError: Invalid email address format: ${trimmedEmail}\n`);
    process.exit(1);
  }

  if (typeof password !== "string" || password.length < 8) {
    console.error("\nError: Password must be at least 8 characters long.\n");
    process.exit(1);
  }

  if (Buffer.byteLength(password, "utf8") > 72) {
    console.error("\nError: Password must be 72 bytes or fewer.\n");
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error("\nDATABASE_URL environment variable is not set.\n");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // 1. Check if user already exists
    const existing = await pool.query(
      "SELECT id, name, email, role, status FROM users WHERE LOWER(email) = $1",
      [trimmedEmail]
    );

    if (existing.rows.length > 0) {
      console.error(`\nAn account with email "${trimmedEmail}" already exists (current role: ${existing.rows[0].role}).`);
      console.error("To promote this existing account to admin, run:\n");
      console.error(`  npm run admin:promote ${trimmedEmail}\n`);
      process.exit(1);
    }

    // 2. Hash password with bcryptjs (12 salt rounds, matching auth.controller.js)
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Insert user as active admin (never select or log password_hash)
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, status)
       VALUES ($1, $2, $3, 'admin', 'active')
       RETURNING id, name, email, role, status, created_at`,
      [trimmedName, trimmedEmail, passwordHash]
    );

    const newUser = result.rows[0];

    // 4. Ensure user_preferences row exists
    await pool.query(
      `INSERT INTO user_preferences (user_id)
       VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING`,
      [newUser.id]
    );

    console.log("\n✔ Admin account created successfully!");
    console.log("----------------------------------------");
    console.log(`  Name:       ${newUser.name}`);
    console.log(`  Email:      ${newUser.email}`);
    console.log(`  Role:       ${newUser.role}`);
    console.log(`  Status:     ${newUser.status}`);
    console.log(`  Created at: ${newUser.created_at}`);
    console.log("----------------------------------------");
    console.log("You can now sign in at http://localhost:5177/login (or http://localhost:5179/login)");
    console.log("Once logged in, click the 'Admin' badge in the navbar or navigate to /admin.\n");
  } catch (err) {
    console.error("\nAdmin creation failed:", err.message, "\n");
    process.exit(1);
  } finally {
    await pool.end();
  }
}

const [nameArg, emailArg, passwordArg] = process.argv.slice(2);
createAdmin(nameArg, emailArg, passwordArg);
