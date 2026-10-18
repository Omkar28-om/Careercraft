import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  getSettings,
  updateSettings,
  changePassword,
} from "../controllers/settings.controller.js";
import { passwordRateLimiter } from "../middleware/rateLimiter.js";

const router = Router();

// All settings routes require authentication
// req.user.id is used internally — never accept user_id from client body
router.use(authenticate);

router.get("/", getSettings);
router.patch("/", updateSettings);
router.patch("/password", passwordRateLimiter, changePassword);

export default router;
