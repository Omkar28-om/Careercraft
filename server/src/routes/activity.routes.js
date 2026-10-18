import { Router } from "express";
import { getUserActivities } from "../controllers/activity.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// GET /api/activity - Fetch authenticated student's recent activities
router.get("/", authenticate, getUserActivities);

export default router;
