import { Router } from "express";
import { register, login, logout, getMe } from "../controllers/auth.controller.js";
import { optionalAuthenticate } from "../middleware/auth.middleware.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.post("/register", authRateLimiter, register);
router.post("/login", authRateLimiter, login);
router.post("/logout", logout);
router.get("/me", optionalAuthenticate, getMe);

export default router;
