import pool from "../db.js";
import {
    createNotification,
    checkLevelUpNotification,
    checkProfileMilestone,
} from "./notification.service.js";

/**
 * Evaluates and awards achievements for an authenticated user.
 * 
 * Inspects trusted database state:
 * - number of skills
 * - profile completeness (bio, college, degree)
 * - total XP
 * 
 * Awards reward XP and records activity transactionally.
 * Idempotent: cannot award the same achievement twice.
 * Non-recursive iterative loop prevents infinite cycles.
 *
 * @param {string} userId - Authenticated user UUID
 * @returns {Promise<Array>} Newly unlocked achievements
 */
export async function evaluateAchievements(userId) {
    if (!userId) return [];

    const newlyUnlockedList = [];
    let hasNewUnlocks = true;
    let iterations = 0;
    const MAX_ITERATIONS = 5;

    while (hasNewUnlocks && iterations < MAX_ITERATIONS) {
        iterations++;
        hasNewUnlocks = false;

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // Ensure student_progress row exists
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

            // Fetch current stats and achievements sequentially on transaction client
            const skillsRes = await client.query("SELECT COUNT(*)::int AS count FROM skills WHERE user_id = $1", [userId]);
            const profileRes = await client.query("SELECT bio, college, degree FROM profiles WHERE id = $1", [userId]);
            const progressRes = await client.query("SELECT total_xp FROM student_progress WHERE user_id = $1", [userId]);
            const unlockedRes = await client.query("SELECT achievement_id FROM user_achievements WHERE user_id = $1", [userId]);
            const allAchievementsRes = await client.query(
                `SELECT id, code, title, description, icon, requirement_type, requirement_value, reward_xp
                 FROM achievements
                 ORDER BY reward_xp ASC`
            );

            const skillCount = skillsRes.rows[0]?.count || 0;
            const profileRow = profileRes.rows[0];
            const isProfileComplete = Boolean(
                profileRow &&
                profileRow.bio && profileRow.bio.trim().length > 0 &&
                profileRow.college && profileRow.college.trim().length > 0 &&
                profileRow.degree && profileRow.degree.trim().length > 0
            );
            const currentTotalXp = progressRes.rows[0]?.total_xp || 0;
            const unlockedSet = new Set(unlockedRes.rows.map((r) => r.achievement_id));

            for (const ach of allAchievementsRes.rows) {
                if (unlockedSet.has(ach.id)) {
                    continue; // Already unlocked
                }

                let isMet = false;
                if (ach.requirement_type === "skill_count") {
                    isMet = skillCount >= (ach.requirement_value || 1);
                } else if (ach.requirement_type === "profile_complete") {
                    isMet = isProfileComplete;
                } else if (ach.requirement_type === "total_xp") {
                    isMet = currentTotalXp >= (ach.requirement_value || 100);
                }

                if (isMet) {
                    // Attempt atomic insertion
                    const insertAch = await client.query(
                        `INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
                         VALUES ($1, $2, NOW())
                         ON CONFLICT (user_id, achievement_id) DO NOTHING
                         RETURNING achievement_id`,
                        [userId, ach.id]
                    );

                    if (insertAch.rows.length > 0) {
                        hasNewUnlocks = true;
                        newlyUnlockedList.push(ach);

                        // Award reward XP atomically
                        const rewardXp = Math.max(0, parseInt(ach.reward_xp, 10) || 0);
                        if (rewardXp > 0) {
                            await client.query(
                                `UPDATE student_progress
                                 SET total_xp = total_xp + $1,
                                     updated_at = NOW()
                                 WHERE user_id = $2`,
                                [rewardXp, userId]
                            );
                        }

                        // Record user activity for the achievement unlock
                        await client.query(
                            `INSERT INTO user_activity (
                                user_id, activity_type, title, description, xp_earned, metadata, created_at
                            )
                            VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
                            [
                                userId,
                                "achievement_unlocked",
                                `Unlocked: ${ach.title}`,
                                ach.description,
                                rewardXp,
                                JSON.stringify({
                                    achievementCode: ach.code,
                                    achievementId: ach.id,
                                    rewardXp,
                                }),
                            ]
                        );
                        // Create achievement_unlocked notification atomically
                        await createNotification({
                            client,
                            userId,
                            type: "achievement_unlocked",
                            title: "Achievement unlocked",
                            message: `You unlocked ${ach.title}.`,
                            link: "/achievements",
                            metadata: {
                                achievementId: ach.id,
                                achievementCode: ach.code,
                                achievementTitle: ach.title,
                                rewardXp,
                            },
                            eventKey: `achievement_unlocked:${userId}:${ach.id}`,
                        });
                    }
                }
            }

            // Check level-up and profile completeness milestones within transaction
            await checkLevelUpNotification({ userId, client });
            await checkProfileMilestone({ userId, client });

            await client.query("COMMIT");
        } catch (error) {
            await client.query("ROLLBACK");
            console.error("evaluateAchievements error:", error);
            throw error;
        } finally {
            client.release();
        }
    }

    return newlyUnlockedList;
}
