import { Router } from "express";
import { getProfile, updateProfile, updateCareerDomain } from "../controllers/profile.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// Routes requiring authentication
router.get("/", authenticate, getProfile);
router.put("/", authenticate, updateProfile);
router.put("/domain", authenticate, updateCareerDomain);

export default router;
