import bcrypt from "bcryptjs";
import pool from "../db.js";

const ALLOWED_THEMES = new Set(["light", "dark", "system"]);

// ======================================================
// GET /api/settings
// Returns current user preferences — never returns password_hash
// ======================================================
export const getSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user safe fields
    const userResult = await pool.query(
      `SELECT id, name, email, role, status, created_at, updated_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Fetch or create preferences (upsert pattern — idempotent)
    await pool.query(
      `INSERT INTO user_preferences (user_id)
       VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    );

    const prefResult = await pool.query(
      `SELECT theme,
              job_notifications,
              course_notifications,
              coding_notifications,
              freelance_notifications,
              system_notifications
       FROM user_preferences
       WHERE user_id = $1`,
      [userId]
    );

    const preferences = prefResult.rows[0] || {
      theme: "dark",
      job_notifications: true,
      course_notifications: true,
      coding_notifications: true,
      freelance_notifications: true,
      system_notifications: true,
    };

    return res.status(200).json({
      success: true,
      user: userResult.rows[0],
      preferences,
    });
  } catch (error) {
    console.error("getSettings error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to load settings" });
  }
};

// ======================================================
// PATCH /api/settings
// Updates notification preferences and/or theme
// ======================================================
export const updateSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      theme,
      job_notifications,
      course_notifications,
      coding_notifications,
      freelance_notifications,
      system_notifications,
    } = req.body;

    // Validate theme if provided
    if (theme !== undefined && !ALLOWED_THEMES.has(theme)) {
      return res.status(400).json({
        success: false,
        message: `Invalid theme. Allowed values: ${[...ALLOWED_THEMES].join(", ")}`,
      });
    }

    // Validate boolean fields if provided
    const boolFields = {
      job_notifications,
      course_notifications,
      coding_notifications,
      freelance_notifications,
      system_notifications,
    };

    for (const [key, value] of Object.entries(boolFields)) {
      if (value !== undefined && typeof value !== "boolean") {
        return res.status(400).json({
          success: false,
          message: `${key} must be a boolean`,
        });
      }
    }

    // Ensure preferences row exists
    await pool.query(
      `INSERT INTO user_preferences (user_id)
       VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    );

    // Build dynamic update
    const updates = [];
    const values = [];
    let paramIdx = 1;

    if (theme !== undefined) {
      updates.push(`theme = $${paramIdx++}`);
      values.push(theme);
    }
    if (job_notifications !== undefined) {
      updates.push(`job_notifications = $${paramIdx++}`);
      values.push(job_notifications);
    }
    if (course_notifications !== undefined) {
      updates.push(`course_notifications = $${paramIdx++}`);
      values.push(course_notifications);
    }
    if (coding_notifications !== undefined) {
      updates.push(`coding_notifications = $${paramIdx++}`);
      values.push(coding_notifications);
    }
    if (freelance_notifications !== undefined) {
      updates.push(`freelance_notifications = $${paramIdx++}`);
      values.push(freelance_notifications);
    }
    if (system_notifications !== undefined) {
      updates.push(`system_notifications = $${paramIdx++}`);
      values.push(system_notifications);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: "No valid fields provided to update" });
    }

    updates.push(`updated_at = NOW()`);
    values.push(userId);

    const prefResult = await pool.query(
      `UPDATE user_preferences
       SET ${updates.join(", ")}
       WHERE user_id = $${paramIdx}
       RETURNING theme, job_notifications, course_notifications,
                 coding_notifications, freelance_notifications,
                 system_notifications`,
      values
    );

    return res.status(200).json({
      success: true,
      message: "Preferences updated",
      preferences: prefResult.rows[0],
    });
  } catch (error) {
    console.error("updateSettings error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to update settings" });
  }
};

// ======================================================
// PATCH /api/settings/password
// Securely changes the authenticated user's password
// Requires current password verification via bcrypt
// Never logs passwords or hashes
// ======================================================
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Input validation — checked before any DB interaction
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
      return res.status(400).json({ success: false, message: "Invalid input" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters",
      });
    }

    if (newPassword === currentPassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from the current password",
      });
    }

    // Fetch current password_hash — never returned to client
    const userResult = await pool.query(
      "SELECT password_hash FROM users WHERE id = $1",
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { password_hash } = userResult.rows[0];

    // Verify current password with bcrypt
    const isMatch = await bcrypt.compare(currentPassword, password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Hash new password — cost factor 12
    const salt = await bcrypt.genSalt(12);
    const newHash = await bcrypt.hash(newPassword, salt);

    // Update — never log newHash, never return it
    await pool.query(
      "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
      [newHash, userId]
    );

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("changePassword error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to change password" });
  }
};
