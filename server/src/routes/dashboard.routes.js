import { Router } from "express";
import { getDashboardData } from "../controllers/dashboard.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// Dashboard route requires authentication
router.get("/", authenticate, getDashboardData);

export default router;
