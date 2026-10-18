import pool from "../db.js";
import { evaluateAchievements } from "../services/achievement.service.js";

/**
 * GET /api/achievements
 * 
 * Returns full list of achievements with unlock status for the authenticated user only.
 * Disregards any user_id supplied in query/body.
 */
export async function getAchievements(req, res) {
    try {
        const userId = req.user.id;

        // Run evaluation to ensure any newly met requirements are unlocked
        try {
            await evaluateAchievements(userId);
        } catch (evalErr) {
            console.error("Achievement evaluation during getAchievements error:", evalErr);
        }

        const result = await pool.query(
            `SELECT 
                a.id,
                a.code,
                a.title,
                a.description,
                a.icon,
                a.requirement_type,
                a.requirement_value,
                a.reward_xp,
                ua.unlocked_at
             FROM achievements a
             LEFT JOIN user_achievements ua 
                ON a.id = ua.achievement_id AND ua.user_id = $1
             ORDER BY a.reward_xp ASC, a.created_at ASC`,
            [userId]
        );

        const achievements = result.rows.map((row) => ({
            id: row.id,
            code: row.code,
            title: row.title,
            description: row.description,
            icon: row.icon,
            requirementType: row.requirement_type,
            requirementValue: row.requirement_value,
            rewardXp: row.reward_xp,
            reward_xp: row.reward_xp,
            unlocked: Boolean(row.unlocked_at),
            unlockedAt: row.unlocked_at || null,
            unlocked_at: row.unlocked_at || null,
        }));

        const unlockedCount = achievements.filter((a) => a.unlocked).length;

        return res.status(200).json({
            success: true,
            achievements,
            summary: {
                unlocked: unlockedCount,
                total: achievements.length,
            },
        });
    } catch (error) {
        console.error("getAchievements error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve achievements",
        });
    }
}
