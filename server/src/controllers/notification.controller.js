import {
    getUserNotifications,
    getUnreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
} from "../services/notification.service.js";

/**
 * GET /api/notifications
 * Retrieves authenticated user's notifications.
 */
export async function getNotifications(req, res) {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20, unreadOnly } = req.query;

        const isUnreadOnly = unreadOnly === "true" || unreadOnly === true;

        const data = await getUserNotifications({
            userId,
            page,
            limit,
            unreadOnly: isUnreadOnly,
        });

        return res.status(200).json({
            success: true,
            notifications: data.notifications,
            pagination: data.pagination,
            unreadCount: data.unreadCount,
        });
    } catch (error) {
        console.error("getNotifications error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch notifications",
        });
    }
}

/**
 * GET /api/notifications/unread-count
 * Retrieves authenticated user's unread notification count.
 */
export async function getUnreadCount(req, res) {
    try {
        const userId = req.user.id;
        const unreadCount = await getUnreadNotificationCount(userId);

        return res.status(200).json({
            success: true,
            unreadCount,
        });
    } catch (error) {
        console.error("getUnreadCount error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch unread notification count",
        });
    }
}

/**
 * PATCH /api/notifications/:id/read
 * Marks a single notification as read if owned by authenticated user.
 */
export async function markAsRead(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const result = await markNotificationAsRead({
            userId,
            notificationId: id,
        });

        if (result.status !== 200) {
            return res.status(result.status).json({
                success: false,
                message: result.message,
            });
        }

        return res.status(200).json({
            success: true,
            message: "Notification marked as read",
            notification: result.notification,
        });
    } catch (error) {
        console.error("markAsRead error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to mark notification as read",
        });
    }
}

/**
 * PATCH /api/notifications/read-all
 * Marks all notifications for authenticated user as read.
 */
export async function markAllRead(req, res) {
    try {
        const userId = req.user.id;
        const updatedCount = await markAllNotificationsAsRead(userId);

        return res.status(200).json({
            success: true,
            message: "All notifications marked as read",
            updatedCount,
        });
    } catch (error) {
        console.error("markAllRead error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to mark all notifications as read",
        });
    }
}

/**
 * DELETE /api/notifications/:id
 * Deletes a notification belonging to authenticated user.
 */
export async function removeNotification(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const result = await deleteNotification({
            userId,
            notificationId: id,
        });

        if (result.status !== 200) {
            return res.status(result.status).json({
                success: false,
                message: result.message,
            });
        }

        return res.status(200).json({
            success: true,
            message: "Notification deleted successfully",
        });
    } catch (error) {
        console.error("removeNotification error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete notification",
        });
    }
}
