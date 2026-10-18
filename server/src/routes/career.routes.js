import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  getCareerProfile,
  getCareerRecommendations,
  regenerateCareerRecommendations,
  getCareerHistory,
  updateCareerPreferences,
  getCareerPaths,
  getCareerPathDetail,
} from "../controllers/career.controller.js";
import { recommendationRateLimiter } from "../middleware/rateLimiter.js";

const router = Router();

// All career endpoints are authenticated and isolated strictly to req.user.id
router.use(authenticate);

// Career profile & verified competencies
router.get("/profile", getCareerProfile);

// Career recommendation engine & snapshots
router.get("/recommendations", getCareerRecommendations);
router.post("/recommendations/regenerate", recommendationRateLimiter, regenerateCareerRecommendations);

// Historical snapshots for authenticated user
router.get("/history", getCareerHistory);

// Career target roles & preferences
router.patch("/preferences", updateCareerPreferences);

// Career path catalog
router.get("/paths", getCareerPaths);
router.get("/paths/:slug", getCareerPathDetail);

export default router;
