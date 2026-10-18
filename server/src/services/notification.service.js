import pool from "../db.js";
import { getLevelFromXp } from "../utils/xpLevel.js";
import { calculateProfileCompleteness } from "../utils/profileCompleteness.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const ALLOWED_NOTIFICATION_TYPES = new Set([
    "job_application",
    "job_status_update",
    "course_enrolled",
    "course_completed",
    "lesson_completed",
    "coding_accepted",
    "achievement_unlocked",
    "level_up",
    "freelance_proposal_submitted",
    "freelance_proposal_accepted",
    "freelance_proposal_rejected",
    "freelance_contract_started",
    "freelance_contract_completed",
    "freelance_contract_cancelled",
    "profile_milestone",
    "career_recommendation",
    "system",
]);

/**
 * Creates a notification safely from trusted backend application events.
 * 
 * @param {Object} params
 * @param {Object} [params.client] - Optional pg client from an active database transaction
 * @param {string} params.userId - Recipient user UUID
 * @param {string} params.type - Controlled notification type
 * @param {string} params.title - Notification title (max 180 chars)
 * @param {string} params.message - Notification body text
 * @param {string} [params.link] - URL / path for navigation
 * @param {Object} [params.metadata] - JSON metadata (e.g. eventKey, sourceId)
 * @param {string} [params.eventKey] - Unique business event key for duplicate prevention
 * @returns {Promise<Object|null>} Created or existing notification
 */
export async function createNotification({
    client,
    userId,
    type,
    title,
    message,
    link = null,
    metadata = {},
    eventKey = null,
}) {
    if (!userId || !UUID_REGEX.test(userId)) {
        throw new Error("Invalid recipient user ID for notification");
    }

    if (!type || !ALLOWED_NOTIFICATION_TYPES.has(type)) {
        throw new Error(`Invalid notification type: ${type}`);
    }

    const cleanTitle = (title || "").trim();
    if (!cleanTitle) {
        throw new Error("Notification title cannot be empty");
    }

    const cleanMessage = (message || "").trim();
    if (!cleanMessage) {
        throw new Error("Notification message cannot be empty");
    }

    const cleanLink = link ? String(link).trim().slice(0, 500) : null;
    const finalEventKey = eventKey || metadata?.eventKey || null;

    const finalMetadata = {
        ...(typeof metadata === "object" && metadata !== null ? metadata : {}),
        ...(finalEventKey ? { eventKey: finalEventKey } : {}),
    };

    const db = client || pool;

    // Duplicate protection: check if an event with this eventKey already exists for this user
    if (finalEventKey) {
        const existingRes = await db.query(
            `SELECT id, user_id, type, title, message, link, metadata, is_read, created_at, read_at
             FROM notifications
             WHERE user_id = $1 AND metadata->>'eventKey' = $2
             LIMIT 1`,
            [userId, finalEventKey]
        );

        if (existingRes.rows.length > 0) {
            // Already created for this business event; return existing to avoid duplicate spam
            return existingRes.rows[0];
        }
    }

    const insertRes = await db.query(
        `INSERT INTO notifications (
            user_id, type, title, message, link, metadata, is_read, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, false, NOW())
        RETURNING id, user_id, type, title, message, link, metadata, is_read, created_at, read_at`,
        [
            userId,
            type,
            cleanTitle.slice(0, 180),
            cleanMessage,
            cleanLink,
            JSON.stringify(finalMetadata),
        ]
    );

    return insertRes.rows[0];
}

/**
 * Retrieves paginated notifications for the authenticated user only.
 */
export async function getUserNotifications({
    userId,
    page = 1,
    limit = 20,
    unreadOnly = false,
}) {
    if (!userId || !UUID_REGEX.test(userId)) {
        throw new Error("Invalid user ID");
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const filterClause = unreadOnly ? "AND is_read = false" : "";

    const [itemsRes, totalRes, unreadRes] = await Promise.all([
        pool.query(
            `SELECT id, user_id, type, title, message, link, metadata, is_read, created_at, read_at
             FROM notifications
             WHERE user_id = $1 ${filterClause}
             ORDER BY created_at DESC
             LIMIT $2 OFFSET $3`,
            [userId, limitNum, offset]
        ),
        pool.query(
            `SELECT COUNT(*)::int AS count
             FROM notifications
             WHERE user_id = $1 ${filterClause}`,
            [userId]
        ),
        pool.query(
            `SELECT COUNT(*)::int AS count
             FROM notifications
             WHERE user_id = $1 AND is_read = false`,
            [userId]
        ),
    ]);

    const total = totalRes.rows[0]?.count || 0;
    const unreadCount = unreadRes.rows[0]?.count || 0;

    const notifications = itemsRes.rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        type: row.type,
        title: row.title,
        message: row.message,
        link: row.link,
        metadata: row.metadata || {},
        isRead: row.is_read,
        createdAt: row.created_at,
        readAt: row.read_at,
    }));

    return {
        notifications,
        pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum) || 1,
        },
        unreadCount,
    };
}

/**
 * Returns the unread notification count for the authenticated user.
 */
export async function getUnreadNotificationCount(userId) {
    if (!userId || !UUID_REGEX.test(userId)) {
        throw new Error("Invalid user ID");
    }

    const result = await pool.query(
        "SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND is_read = false",
        [userId]
    );

    return result.rows[0]?.count || 0;
}

/**
 * Marks a single notification as read if owned by the user.
 */
export async function markNotificationAsRead({ userId, notificationId }) {
    if (!userId || !UUID_REGEX.test(userId) || !notificationId || !UUID_REGEX.test(notificationId)) {
        return { status: 400, message: "Valid notification UUID is required" };
    }

    // Verify existence & ownership
    const checkRes = await pool.query(
        "SELECT id, user_id, is_read FROM notifications WHERE id = $1",
        [notificationId]
    );

    if (checkRes.rows.length === 0) {
        return { status: 404, message: "Notification not found" };
    }

    if (checkRes.rows[0].user_id !== userId) {
        return { status: 403, message: "Access denied to this notification" };
    }

    const updateRes = await pool.query(
        `UPDATE notifications
         SET is_read = true,
             read_at = COALESCE(read_at, NOW())
         WHERE id = $1 AND user_id = $2
         RETURNING id, user_id, type, title, message, link, metadata, is_read, created_at, read_at`,
        [notificationId, userId]
    );

    const row = updateRes.rows[0];
    return {
        status: 200,
        notification: {
            id: row.id,
            userId: row.user_id,
            type: row.type,
            title: row.title,
            message: row.message,
            link: row.link,
            metadata: row.metadata || {},
            isRead: row.is_read,
            createdAt: row.created_at,
            readAt: row.read_at,
        },
    };
}

/**
 * Marks all unread notifications for the user as read.
 */
export async function markAllNotificationsAsRead(userId) {
    if (!userId || !UUID_REGEX.test(userId)) {
        throw new Error("Invalid user ID");
    }

    const result = await pool.query(
        `UPDATE notifications
         SET is_read = true,
             read_at = NOW()
         WHERE user_id = $1 AND is_read = false`,
        [userId]
    );

    return result.rowCount || 0;
}

/**
 * Deletes a notification belonging to the user.
 */
export async function deleteNotification({ userId, notificationId }) {
    if (!userId || !UUID_REGEX.test(userId) || !notificationId || !UUID_REGEX.test(notificationId)) {
        return { status: 400, message: "Valid notification UUID is required" };
    }

    // Verify existence & ownership
    const checkRes = await pool.query(
        "SELECT id, user_id FROM notifications WHERE id = $1",
        [notificationId]
    );

    if (checkRes.rows.length === 0) {
        return { status: 404, message: "Notification not found" };
    }

    if (checkRes.rows[0].user_id !== userId) {
        return { status: 403, message: "Access denied to this notification" };
    }

    await pool.query(
        "DELETE FROM notifications WHERE id = $1 AND user_id = $2",
        [notificationId, userId]
    );

    return { status: 200, message: "Notification deleted successfully" };
}

/**
 * Checks if user's current XP places them at a higher level than previously notified.
 * Idempotently creates a level_up notification only when the level actually increases.
 */
export async function checkLevelUpNotification({ userId, client = null }) {
    if (!userId || !UUID_REGEX.test(userId)) return;

    const db = client || pool;
    const progressRes = await db.query(
        "SELECT total_xp FROM student_progress WHERE user_id = $1",
        [userId]
    );

    if (progressRes.rows.length === 0) return;

    const totalXp = progressRes.rows[0].total_xp || 0;
    const currentLevel = getLevelFromXp(totalXp);

    if (currentLevel > 1) {
        for (let lvl = 2; lvl <= currentLevel; lvl++) {
            await createNotification({
                client,
                userId,
                type: "level_up",
                title: "Level up!",
                message: `You reached Level ${lvl}.`,
                link: "/dashboard",
                metadata: {
                    level: lvl,
                    totalXp,
                },
                eventKey: `level_up:${userId}:${lvl}`,
            });
        }
    }
}

/**
 * Checks if user's profile completeness has reached 100% for the first time.
 * Idempotently creates a profile_milestone notification exactly once.
 */
export async function checkProfileMilestone({ userId, client = null }) {
    if (!userId || !UUID_REGEX.test(userId)) return;

    const db = client || pool;
    const [profileRes, skillsRes] = await Promise.all([
        db.query("SELECT * FROM profiles WHERE id = $1", [userId]),
        db.query("SELECT COUNT(*)::int AS count FROM skills WHERE user_id = $1", [userId]),
    ]);

    const profile = profileRes.rows[0] || {};
    const skillCount = skillsRes.rows[0]?.count || 0;
    const { percentage } = calculateProfileCompleteness(profile, skillCount);

    if (percentage === 100) {
        await createNotification({
            client,
            userId,
            type: "profile_milestone",
            title: "Profile complete",
            message: "Your CareerCraft profile is now complete.",
            link: "/profile",
            metadata: {
                milestone: "profile_complete_100",
                completeness: 100,
            },
            eventKey: `profile_milestone:${userId}:100`,
        });
    }
}
