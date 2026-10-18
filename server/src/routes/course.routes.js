import { Router } from "express";
import {
    getCourses,
    getCourse,
    getCourseSections,
    getCourseLesson,
    enrollCourse,
    getEnrollments,
    getCourseProgress,
    completeLesson,
} from "../controllers/course.controller.js";
import { authenticate, optionalAuthenticate } from "../middleware/auth.middleware.js";

const router = Router();

// 1. Enrollment-specific routes (MUST be registered before /:slug)
router.get("/enrollments", authenticate, getEnrollments);
router.post("/lessons/:lessonId/complete", authenticate, completeLesson);
router.post("/:courseId/enroll", authenticate, enrollCourse);
router.get("/:courseId/progress", authenticate, getCourseProgress);

// 2. Public / semi-public catalog and course detail routes
router.get("/", optionalAuthenticate, getCourses);
router.get("/:slug", optionalAuthenticate, getCourse);
router.get("/:slug/sections", getCourseSections);
router.get("/:slug/lessons/:lessonSlug", optionalAuthenticate, getCourseLesson);

export default router;
