import { Router } from "express";
import { getAchievements } from "../controllers/achievement.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// GET /api/achievements - Fetch authenticated student's achievements and unlocks
router.get("/", authenticate, getAchievements);

export default router;
