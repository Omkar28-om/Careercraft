import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/admin.middleware.js";
import {
    getAdminStats,
    getUsers,
    getUserDetail,
    updateUserStatus,
    updateUserRole,
    getAdminCourses,
    getAdminCourseDetail,
    publishCourse,
    unpublishCourse,
    getAdminJobs,
    getAdminJobDetail,
    updateJobStatus,
    getAdminCodingProblems,
    getAdminCodingProblemDetail,
    updateCodingProblemStatus,
    getAdminProjects,
    getAdminProjectDetail,
    updateProjectStatus,
    getAdminFreelanceProjects,
    getAdminFreelanceProjectDetail,
    updateFreelanceProjectStatus,
    getAdminNotifications,
    getAdminAuditLogs,
} from "../controllers/admin.controller.js";

const router = Router();

// Protect ALL admin routes with server-side authentication and live database admin role checks
router.use(authenticate, requireAdmin);

// Dashboard Statistics
router.get("/stats", getAdminStats);

// User Management
router.get("/users", getUsers);
router.get("/users/:id", getUserDetail);
router.patch("/users/:id/status", updateUserStatus);
router.patch("/users/:id/role", updateUserRole);

// Course Management
router.get("/courses", getAdminCourses);
router.get("/courses/:id", getAdminCourseDetail);
router.patch("/courses/:id/publish", publishCourse);
router.patch("/courses/:id/unpublish", unpublishCourse);

// Job Management
router.get("/jobs", getAdminJobs);
router.get("/jobs/:id", getAdminJobDetail);
router.patch("/jobs/:id/status", updateJobStatus);

// Coding Problem Management
router.get("/coding/problems", getAdminCodingProblems);
router.get("/coding/problems/:id", getAdminCodingProblemDetail);
router.patch("/coding/problems/:id/status", updateCodingProblemStatus);

// Project Moderation
router.get("/projects", getAdminProjects);
router.get("/projects/:id", getAdminProjectDetail);
router.patch("/projects/:id/status", updateProjectStatus);

// Freelance Moderation
router.get("/freelance/projects", getAdminFreelanceProjects);
router.get("/freelance/projects/:id", getAdminFreelanceProjectDetail);
router.patch("/freelance/projects/:id/status", updateFreelanceProjectStatus);

// Notification Management (Read-only overview)
router.get("/notifications", getAdminNotifications);

// Audit Logs (Read-only)
router.get("/audit-logs", getAdminAuditLogs);

export default router;
