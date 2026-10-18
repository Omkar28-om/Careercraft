import { Router } from "express";
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllRead,
    removeNotification,
} from "../controllers/notification.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// All notification routes require authentication
router.use(authenticate);

// Unread count & bulk actions (MUST be placed before /:id)
router.get("/unread-count", getUnreadCount);
router.patch("/read-all", markAllRead);

// Notifications collection
router.get("/", getNotifications);

// Single notification actions
router.patch("/:id/read", markAsRead);
router.delete("/:id", removeNotification);

export default router;
