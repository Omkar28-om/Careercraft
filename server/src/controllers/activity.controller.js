import pool from "../db.js";

/**
 * INTERNAL HELPER: recordActivity
 * 
 * Safely inserts a user activity and updates student_progress.total_xp in a database transaction.
 * NEVER exposed as a public endpoint.
 *
 * @param {Object} params
 * @param {string} params.userId - Authenticated user UUID
 * @param {string} params.activityType - Categorization tag (e.g. 'skill_added', 'profile_update')
 * @param {string} params.title - Activity headline
 * @param {string} [params.description] - Additional context/details
 * @param {number} [params.xpEarned=0] - XP awarded (must be non-negative)
 * @param {Object} [params.metadata={}] - Safe contextual JSON metadata
 * @returns {Promise<Object>} The inserted activity record
 */
export async function recordActivity({
    userId,
    activityType,
    title,
    description = null,
    xpEarned = 0,
    metadata = {},
}) {
    if (!userId) {
        throw new Error("recordActivity requires a valid userId");
    }

    const safeXp = Math.max(0, parseInt(xpEarned, 10) || 0);
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // 1. Ensure student_progress record exists for the user
        await client.query(
            `INSERT INTO student_progress (
                user_id, total_xp, current_streak, longest_streak,
                problems_solved, courses_completed, projects_completed,
                created_at, updated_at
            )
            VALUES ($1, 0, 0, 0, 0, 0, 0, NOW(), NOW())
            ON CONFLICT (user_id) DO NOTHING`,
            [userId]
        );

        // 2. Insert the activity row
        const activityResult = await client.query(
            `INSERT INTO user_activity (
                user_id, activity_type, title, description, xp_earned, metadata, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            RETURNING id, user_id, activity_type, title, description, xp_earned, metadata, created_at`,
            [
                userId,
                activityType,
                title,
                description,
                safeXp,
                JSON.stringify(metadata || {}),
            ]
        );

        // 3. If XP was earned, atomically update student_progress.total_xp
        if (safeXp > 0) {
            await client.query(
                `UPDATE student_progress
                 SET total_xp = total_xp + $1,
                     updated_at = NOW()
                 WHERE user_id = $2`,
                [safeXp, userId]
            );
        }

        await client.query("COMMIT");
        return activityResult.rows[0];
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("recordActivity transaction failed:", error);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * GET /api/activity
 * 
 * Retrieves recent activities for the authenticated user only.
 * Parameterized SQL. Disregards any client-supplied user_id in query or body.
 */
export async function getUserActivities(req, res) {
    try {
        const userId = req.user.id;
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));

        const result = await pool.query(
            `SELECT 
                id,
                user_id,
                activity_type,
                title,
                description,
                xp_earned,
                metadata,
                created_at
             FROM user_activity
             WHERE user_id = $1
             ORDER BY created_at DESC
             LIMIT $2`,
            [userId, limit]
        );

        const activities = result.rows.map((row) => ({
            id: row.id,
            userId: row.user_id,
            activityType: row.activity_type,
            activity_type: row.activity_type,
            title: row.title,
            description: row.description,
            xpEarned: row.xp_earned,
            xp_earned: row.xp_earned,
            metadata: row.metadata,
            createdAt: row.created_at,
            created_at: row.created_at,
        }));

        return res.status(200).json({
            success: true,
            activities,
        });
    } catch (error) {
        console.error("getUserActivities error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve user activities",
        });
    }
}
