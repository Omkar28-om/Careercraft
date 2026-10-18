/**
 * CareerCraft — Admin Promote Utility
 *
 * DEVELOPMENT-ONLY tool to promote an existing user to admin role.
 *
 * Usage:
 *   node scripts/promote-admin.js user@example.com
 *
 * Security:
 *   - Runs server-side only; never exposed as an API endpoint
 *   - Never creates users, never prints passwords or hashes
 *   - Requires the user to already exist in the database
 *   - Only sets role = 'admin' and ensures status = 'active'
 *   - Only prints safe confirmation information
 */

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const { Pool } = pg;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function promoteToAdmin(email) {
  if (!email || typeof email !== "string") {
    console.error("\nUsage: node scripts/promote-admin.js user@example.com\n");
    process.exit(1);
  }

  const trimmedEmail = email.trim().toLowerCase();

  if (!EMAIL_REGEX.test(trimmedEmail)) {
    console.error(`\nInvalid email address: ${trimmedEmail}\n`);
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error("\nDATABASE_URL environment variable is not set.\n");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // Find the user — never SELECT password_hash
    const findResult = await pool.query(
      "SELECT id, name, email, role, status FROM users WHERE LOWER(email) = $1",
      [trimmedEmail]
    );

    if (findResult.rows.length === 0) {
      console.error(`\nNo account found with email: ${trimmedEmail}`);
      console.error("Please register the account first, then run this script.\n");
      process.exit(1);
    }

    const user = findResult.rows[0];

    if (user.role === "admin" && user.status === "active") {
      console.log("\n✔ This account is already an active admin.");
      console.log(`  Name:  ${user.name}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Role:  ${user.role}`);
      console.log(`  Status: ${user.status}\n`);
      await pool.end();
      return;
    }

    // Promote: set role = 'admin', ensure status = 'active'
    const updateResult = await pool.query(
      `UPDATE users
       SET role = 'admin', status = 'active', updated_at = NOW()
       WHERE id = $1
       RETURNING id, name, email, role, status, updated_at`,
      [user.id]
    );

    const updated = updateResult.rows[0];

    // Also ensure preferences row exists
    await pool.query(
      `INSERT INTO user_preferences (user_id)
       VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING`,
      [updated.id]
    );

    console.log("\n✔ Admin promotion successful.");
    console.log(`  Name:       ${updated.name}`);
    console.log(`  Email:      ${updated.email}`);
    console.log(`  Role:       ${updated.role}`);
    console.log(`  Status:     ${updated.status}`);
    console.log(`  Updated at: ${updated.updated_at}`);
    console.log("\n  This account can now log in and access the Admin Panel.\n");
  } catch (err) {
    console.error("\nPromotion failed:", err.message, "\n");
    process.exit(1);
  } finally {
    await pool.end();
  }
}

const emailArg = process.argv[2];
promoteToAdmin(emailArg);
