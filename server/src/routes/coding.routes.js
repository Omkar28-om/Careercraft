import { Router } from "express";
import {
    getCodingProblems,
    getCodingProblem,
    createSubmission,
    getUserSubmissions,
    getProblemProgress,
} from "../controllers/coding.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { codeSubmissionRateLimiter } from "../middleware/rateLimiter.js";

const router = Router();

// Public problem browsing
router.get("/problems", getCodingProblems);
router.get("/problems/:slug", getCodingProblem);

// Authenticated submission and progress operations
router.post("/problems/:problemId/submissions", authenticate, codeSubmissionRateLimiter, createSubmission);
router.get("/submissions", authenticate, getUserSubmissions);
router.get("/problems/:problemId/progress", authenticate, getProblemProgress);

export default router;
