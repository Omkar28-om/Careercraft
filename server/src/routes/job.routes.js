import { Router } from "express";
import {
    getJobs,
    getJob,
    applyToJob,
    getApplications,
    getApplication,
    updateApplicationStatus,
    saveJob,
    unsaveJob,
    getSavedJobs,
} from "../controllers/job.controller.js";
import { authenticate, optionalAuthenticate } from "../middleware/auth.middleware.js";

const router = Router();

// 1. Applications and Saved routes (MUST come before /:id)
router.get("/saved", authenticate, getSavedJobs);
router.get("/applications", authenticate, getApplications);
router.get("/applications/:id", authenticate, getApplication);
router.patch("/applications/:id/status", authenticate, updateApplicationStatus);

// 2. Specific job action routes
router.post("/:jobId/apply", authenticate, applyToJob);
router.post("/:jobId/save", authenticate, saveJob);
router.delete("/:jobId/save", authenticate, unsaveJob);

// 3. Catalog and detail routes
router.get("/", optionalAuthenticate, getJobs);
router.get("/:id", optionalAuthenticate, getJob);

export default router;
