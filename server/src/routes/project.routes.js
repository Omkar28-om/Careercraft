import { Router } from "express";
import {
    getProjects,
    getProject,
    getPublicProjects,
    createProject,
    updateProject,
    deleteProject,
} from "../controllers/project.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// Public portfolio access (is_public = true projects only)
router.get("/public/:userId", getPublicProjects);

// Authenticated student projects management
router.get("/", authenticate, getProjects);
router.get("/:id", authenticate, getProject);
router.post("/", authenticate, createProject);
router.put("/:id", authenticate, updateProject);
router.patch("/:id", authenticate, updateProject);
router.delete("/:id", authenticate, deleteProject);

export default router;
