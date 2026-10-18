import pool from "../db.js";
import { evaluateAchievements } from "../services/achievement.service.js";
import { createNotification } from "../services/notification.service.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Format course summary object
 */
function formatCourseSummary(row) {
    if (!row) return null;
    return {
        id: row.id,
        title: row.title,
        slug: row.slug,
        shortDescription: row.short_description || row.shortDescription,
        description: row.description,
        thumbnailUrl: row.thumbnail_url || row.thumbnailUrl,
        category: row.category,
        level: row.level,
        instructorName: row.instructor_name || row.instructorName,
        durationMinutes: row.duration_minutes || row.durationMinutes,
        lessonCount: Number(row.lesson_count || row.lessonCount || 0),
        isPublished: row.is_published,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        // Optional enrollment fields if joined
        isEnrolled: row.is_enrolled !== undefined ? Boolean(row.is_enrolled) : undefined,
        progressPercent: row.progress_percent !== undefined ? Number(row.progress_percent) : undefined,
        enrollmentStatus: row.enrollment_status || undefined,
    };
}

/**
 * GET /api/courses
 * Public course catalog (published only). Supports search, category, level.
 */
export async function getCourses(req, res) {
    try {
        const { search, category, level } = req.query;
        const currentUserId = req.user?.id || null;

        const conditions = ["c.is_published = true"];
        const params = [];

        if (search && search.trim()) {
            params.push(`%${search.trim().toLowerCase()}%`);
            conditions.push(`(LOWER(c.title) LIKE $${params.length} OR LOWER(c.short_description) LIKE $${params.length} OR LOWER(c.description) LIKE $${params.length})`);
        }

        if (category && category.trim() && category.trim().toLowerCase() !== "all") {
            params.push(category.trim());
            conditions.push(`c.category = $${params.length}`);
        }

        if (level && level.trim() && level.trim().toLowerCase() !== "all") {
            params.push(level.trim().toLowerCase());
            conditions.push(`c.level = $${params.length}`);
        }

        let enrollmentJoin = "";
        let enrollmentSelect = "";
        if (currentUserId) {
            params.push(currentUserId);
            enrollmentJoin = `LEFT JOIN course_enrollments e ON c.id = e.course_id AND e.user_id = $${params.length}`;
            enrollmentSelect = `, (e.id IS NOT NULL) AS is_enrolled, e.progress_percent, e.status AS enrollment_status`;
        }

        const query = `
            SELECT 
                c.id, c.title, c.slug, c.short_description, c.description,
                c.thumbnail_url, c.category, c.level, c.instructor_name,
                c.duration_minutes, c.is_published, c.created_at, c.updated_at,
                COUNT(l.id)::int AS lesson_count
                ${enrollmentSelect}
            FROM courses c
            LEFT JOIN course_sections s ON c.id = s.course_id
            LEFT JOIN course_lessons l ON s.id = l.section_id
            ${enrollmentJoin}
            WHERE ${conditions.join(" AND ")}
            GROUP BY c.id ${currentUserId ? ", e.id, e.progress_percent, e.status" : ""}
            ORDER BY c.created_at ASC
        `;

        const result = await pool.query(query, params);

        return res.status(200).json({
            success: true,
            courses: result.rows.map(formatCourseSummary),
        });
    } catch (error) {
        console.error("getCourses error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch courses",
        });
    }
}

/**
 * GET /api/courses/:slug
 * Public course detail (published only) with section and lesson summaries.
 */
export async function getCourse(req, res) {
    try {
        const { slug } = req.params;
        const currentUserId = req.user?.id || null;

        if (!slug || typeof slug !== "string") {
            return res.status(400).json({
                success: false,
                message: "Course slug is required",
            });
        }

        // Fetch course
        const courseRes = await pool.query(
            `SELECT id, title, slug, short_description, description, thumbnail_url,
                    category, level, instructor_name, duration_minutes, is_published,
                    created_at, updated_at
             FROM courses
             WHERE slug = $1 AND is_published = true`,
            [slug]
        );

        if (courseRes.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Course not found",
            });
        }

        const course = courseRes.rows[0];

        // Fetch sections and lessons
        const sectionsRes = await pool.query(
            `SELECT id, title, description, section_order
             FROM course_sections
             WHERE course_id = $1
             ORDER BY section_order ASC`,
            [course.id]
        );

        const lessonsRes = await pool.query(
            `SELECT l.id, l.section_id, l.title, l.slug, l.lesson_order,
                    l.duration_minutes, l.lesson_type, l.is_preview
             FROM course_lessons l
             JOIN course_sections s ON l.section_id = s.id
             WHERE s.course_id = $1
             ORDER BY s.section_order ASC, l.lesson_order ASC`,
            [course.id]
        );

        // Fetch user enrollment & lesson progress if logged in
        let enrollment = null;
        const completedLessonIds = new Set();
        if (currentUserId) {
            const enrollRes = await pool.query(
                `SELECT id, progress_percent, status, enrolled_at, completed_at
                 FROM course_enrollments
                 WHERE course_id = $1 AND user_id = $2`,
                [course.id, currentUserId]
            );
            if (enrollRes.rows.length > 0) {
                enrollment = enrollRes.rows[0];

                const progRes = await pool.query(
                    `SELECT p.lesson_id
                     FROM course_lesson_progress p
                     JOIN course_lessons l ON p.lesson_id = l.id
                     JOIN course_sections s ON l.section_id = s.id
                     WHERE s.course_id = $1 AND p.user_id = $2 AND p.completed = true`,
                    [course.id, currentUserId]
                );
                progRes.rows.forEach((r) => completedLessonIds.add(r.lesson_id));
            }
        }

        // Nest lessons inside sections
        const lessonsBySection = {};
        lessonsRes.rows.forEach((les) => {
            if (!lessonsBySection[les.section_id]) {
                lessonsBySection[les.section_id] = [];
            }
            lessonsBySection[les.section_id].push({
                id: les.id,
                title: les.title,
                slug: les.slug,
                lessonOrder: les.lesson_order,
                durationMinutes: les.duration_minutes,
                lessonType: les.lesson_type,
                isPreview: les.is_preview,
                completed: completedLessonIds.has(les.id),
            });
        });

        const formattedSections = sectionsRes.rows.map((sec) => ({
            id: sec.id,
            title: sec.title,
            description: sec.description,
            sectionOrder: sec.section_order,
            lessons: lessonsBySection[sec.id] || [],
        }));

        return res.status(200).json({
            success: true,
            course: {
                id: course.id,
                title: course.title,
                slug: course.slug,
                shortDescription: course.short_description,
                description: course.description,
                thumbnailUrl: course.thumbnail_url,
                category: course.category,
                level: course.level,
                instructorName: course.instructor_name,
                durationMinutes: course.duration_minutes,
                lessonCount: lessonsRes.rows.length,
                isEnrolled: Boolean(enrollment),
                progressPercent: enrollment ? enrollment.progress_percent : 0,
                status: enrollment ? enrollment.status : null,
                enrolledAt: enrollment ? enrollment.enrolled_at : null,
                completedAt: enrollment ? enrollment.completed_at : null,
                sections: formattedSections,
            },
        });
    } catch (error) {
        console.error("getCourse error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch course details",
        });
    }
}

/**
 * GET /api/courses/:slug/sections
 * Convenience endpoint for sections
 */
export async function getCourseSections(req, res) {
    try {
        const { slug } = req.params;
        const courseRes = await pool.query(
            "SELECT id FROM courses WHERE slug = $1 AND is_published = true",
            [slug]
        );
        if (courseRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }
        const sectionsRes = await pool.query(
            "SELECT id, title, description, section_order FROM course_sections WHERE course_id = $1 ORDER BY section_order ASC",
            [courseRes.rows[0].id]
        );
        return res.status(200).json({ success: true, sections: sectionsRes.rows });
    } catch (error) {
        console.error("getCourseSections error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch sections" });
    }
}

/**
 * GET /api/courses/:slug/lessons/:lessonSlug
 * Lesson details with content.
 * Public users can access preview lessons (is_preview = true).
 * Non-preview lessons require authentication and enrollment.
 */
export async function getCourseLesson(req, res) {
    try {
        const { slug, lessonSlug } = req.params;
        const currentUserId = req.user?.id || null;

        // Fetch course
        const courseRes = await pool.query(
            "SELECT id, title, slug, is_published FROM courses WHERE slug = $1 AND is_published = true",
            [slug]
        );
        if (courseRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }
        const course = courseRes.rows[0];

        // Fetch all lessons in order to calculate prev/next and locate current lesson
        const allLessonsRes = await pool.query(
            `SELECT l.id, l.title, l.slug, l.lesson_order, l.content, l.video_url,
                    l.duration_minutes, l.lesson_type, l.is_preview,
                    s.id AS section_id, s.title AS section_title, s.section_order
             FROM course_lessons l
             JOIN course_sections s ON l.section_id = s.id
             WHERE s.course_id = $1
             ORDER BY s.section_order ASC, l.lesson_order ASC`,
            [course.id]
        );

        const currentIndex = allLessonsRes.rows.findIndex((l) => l.slug === lessonSlug);
        if (currentIndex === -1) {
            return res.status(404).json({ success: false, message: "Lesson not found in this course" });
        }

        const currentLesson = allLessonsRes.rows[currentIndex];

        // Access check
        let isEnrolled = false;
        let lessonProgress = null;

        if (currentUserId) {
            const enrollRes = await pool.query(
                "SELECT id, status, progress_percent FROM course_enrollments WHERE course_id = $1 AND user_id = $2",
                [course.id, currentUserId]
            );
            isEnrolled = enrollRes.rows.length > 0;

            if (isEnrolled) {
                // Fetch or update last accessed
                const progRes = await pool.query(
                    `SELECT completed, completed_at, last_accessed_at
                     FROM course_lesson_progress
                     WHERE lesson_id = $1 AND user_id = $2`,
                    [currentLesson.id, currentUserId]
                );
                if (progRes.rows.length > 0) {
                    lessonProgress = progRes.rows[0];
                    // Update last accessed in background
                    pool.query(
                        "UPDATE course_lesson_progress SET last_accessed_at = NOW() WHERE lesson_id = $1 AND user_id = $2",
                        [currentLesson.id, currentUserId]
                    ).catch((e) => console.error("last_accessed_at update err:", e));
                }
            }
        }

        if (!currentLesson.is_preview) {
            if (!currentUserId) {
                return res.status(401).json({
                    success: false,
                    message: "Authentication required to access this lesson",
                });
            }
            if (!isEnrolled) {
                return res.status(403).json({
                    success: false,
                    message: "Course enrollment required to access this lesson",
                });
            }
        }

        const prevLesson = currentIndex > 0 ? {
            title: allLessonsRes.rows[currentIndex - 1].title,
            slug: allLessonsRes.rows[currentIndex - 1].slug,
        } : null;

        const nextLesson = currentIndex < allLessonsRes.rows.length - 1 ? {
            title: allLessonsRes.rows[currentIndex + 1].title,
            slug: allLessonsRes.rows[currentIndex + 1].slug,
        } : null;

        return res.status(200).json({
            success: true,
            lesson: {
                id: currentLesson.id,
                title: currentLesson.title,
                slug: currentLesson.slug,
                lessonOrder: currentLesson.lesson_order,
                content: currentLesson.content,
                videoUrl: currentLesson.video_url,
                durationMinutes: currentLesson.duration_minutes,
                lessonType: currentLesson.lesson_type,
                isPreview: currentLesson.is_preview,
                completed: lessonProgress ? Boolean(lessonProgress.completed) : false,
                completedAt: lessonProgress ? lessonProgress.completed_at : null,
                lastAccessedAt: lessonProgress ? lessonProgress.last_accessed_at : null,
            },
            course: {
                id: course.id,
                title: course.title,
                slug: course.slug,
            },
            section: {
                id: currentLesson.section_id,
                title: currentLesson.section_title,
                sectionOrder: currentLesson.section_order,
            },
            navigation: {
                previousLesson: prevLesson,
                nextLesson: nextLesson,
            },
            isEnrolled,
        });
    } catch (error) {
        console.error("getCourseLesson error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch lesson",
        });
    }
}

/**
 * POST /api/courses/:courseId/enroll
 * Authenticated idempotent enrollment.
 */
export async function enrollCourse(req, res) {
    try {
        const userId = req.user.id;
        const { courseId } = req.params;

        if (!courseId || !UUID_REGEX.test(courseId)) {
            return res.status(400).json({
                success: false,
                message: "Valid course UUID is required",
            });
        }

        // Verify course exists and is published
        const courseRes = await pool.query(
            "SELECT id, title, slug, is_published FROM courses WHERE id = $1",
            [courseId]
        );
        if (courseRes.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Course not found",
            });
        }
        if (!courseRes.rows[0].is_published) {
            return res.status(400).json({
                success: false,
                message: "Cannot enroll in an unpublished course",
            });
        }

        // Check if enrollment already existed
        const existingEnroll = await pool.query(
            "SELECT id FROM course_enrollments WHERE user_id = $1 AND course_id = $2",
            [userId, courseId]
        );
        const isNewEnrollment = existingEnroll.rows.length === 0;

        // Insert or return existing enrollment (idempotent)
        const insertRes = await pool.query(
            `INSERT INTO course_enrollments (user_id, course_id, progress_percent, status, enrolled_at, updated_at)
             VALUES ($1, $2, 0, 'active', NOW(), NOW())
             ON CONFLICT (user_id, course_id) DO UPDATE SET updated_at = NOW()
             RETURNING id, user_id, course_id, progress_percent, status, enrolled_at, completed_at`,
            [userId, courseId]
        );

        const enrollment = insertRes.rows[0];

        // Create notification on new enrollment
        if (isNewEnrollment) {
            await createNotification({
                userId,
                type: "course_enrolled",
                title: "Course enrollment confirmed",
                message: `You have enrolled in ${courseRes.rows[0].title}.`,
                link: `/courses/${courseRes.rows[0].slug}`,
                metadata: {
                    courseId: courseRes.rows[0].id,
                    courseTitle: courseRes.rows[0].title,
                    courseSlug: courseRes.rows[0].slug,
                },
                eventKey: `course_enrolled:${userId}:${courseRes.rows[0].id}`,
            });
        }

        return res.status(200).json({
            success: true,
            message: "Course enrollment active",
            enrollment: {
                id: enrollment.id,
                userId: enrollment.user_id,
                courseId: enrollment.course_id,
                progressPercent: enrollment.progress_percent,
                status: enrollment.status,
                enrolledAt: enrollment.enrolled_at,
                completedAt: enrollment.completed_at,
            },
        });
    } catch (error) {
        console.error("enrollCourse error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to enroll in course",
        });
    }
}

/**
 * GET /api/courses/enrollments
 * Returns all course enrollments for the authenticated user.
 */
export async function getEnrollments(req, res) {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            `SELECT 
                e.id AS enrollment_id,
                e.course_id,
                e.progress_percent,
                e.status,
                e.enrolled_at,
                e.completed_at,
                c.title,
                c.slug,
                c.thumbnail_url,
                c.category,
                c.level,
                c.instructor_name,
                c.duration_minutes,
                c.short_description,
                COUNT(l.id)::int AS lesson_count
             FROM course_enrollments e
             JOIN courses c ON e.course_id = c.id
             LEFT JOIN course_sections s ON c.id = s.course_id
             LEFT JOIN course_lessons l ON s.id = l.section_id
             WHERE e.user_id = $1 AND c.is_published = true
             GROUP BY e.id, c.id
             ORDER BY e.updated_at DESC`,
            [userId]
        );

        const enrollments = result.rows.map((r) => ({
            id: r.enrollment_id,
            courseId: r.course_id,
            title: r.title,
            slug: r.slug,
            thumbnailUrl: r.thumbnail_url,
            category: r.category,
            level: r.level,
            instructorName: r.instructor_name,
            durationMinutes: r.duration_minutes,
            shortDescription: r.short_description,
            lessonCount: r.lesson_count,
            progressPercent: r.progress_percent,
            status: r.status,
            enrolledAt: r.enrolled_at,
            completedAt: r.completed_at,
        }));

        return res.status(200).json({
            success: true,
            enrollments,
        });
    } catch (error) {
        console.error("getEnrollments error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch enrollments",
        });
    }
}

/**
 * GET /api/courses/:courseId/progress
 * Authenticated user's progress on a course.
 */
export async function getCourseProgress(req, res) {
    try {
        const userId = req.user.id;
        const { courseId } = req.params;

        if (!courseId || !UUID_REGEX.test(courseId)) {
            return res.status(400).json({
                success: false,
                message: "Valid course UUID is required",
            });
        }

        const enrollRes = await pool.query(
            "SELECT id, progress_percent, status, enrolled_at, completed_at FROM course_enrollments WHERE course_id = $1 AND user_id = $2",
            [courseId, userId]
        );

        if (enrollRes.rows.length === 0) {
            return res.status(200).json({
                success: true,
                courseId,
                enrolled: false,
                status: null,
                progressPercent: 0,
                completedLessons: 0,
                totalLessons: 0,
                lessonProgress: [],
            });
        }

        const enrollment = enrollRes.rows[0];

        // Total lessons
        const totalRes = await pool.query(
            `SELECT l.id
             FROM course_lessons l
             JOIN course_sections s ON l.section_id = s.id
             WHERE s.course_id = $1`,
            [courseId]
        );
        const totalLessons = totalRes.rows.length;

        // Lesson progress
        const progRes = await pool.query(
            `SELECT p.lesson_id, p.completed, p.completed_at, p.last_accessed_at
             FROM course_lesson_progress p
             JOIN course_lessons l ON p.lesson_id = l.id
             JOIN course_sections s ON l.section_id = s.id
             WHERE s.course_id = $1 AND p.user_id = $2`,
            [courseId, userId]
        );

        const completedCount = progRes.rows.filter((p) => p.completed).length;

        return res.status(200).json({
            success: true,
            courseId,
            enrolled: true,
            status: enrollment.status,
            progressPercent: enrollment.progress_percent,
            completedLessons: completedCount,
            totalLessons,
            completedAt: enrollment.completed_at,
            lessonProgress: progRes.rows.map((p) => ({
                lessonId: p.lesson_id,
                completed: p.completed,
                completedAt: p.completed_at,
                lastAccessedAt: p.last_accessed_at,
            })),
        });
    } catch (error) {
        console.error("getCourseProgress error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch course progress",
        });
    }
}

/**
 * POST /api/courses/lessons/:lessonId/complete
 * Idempotently marks a lesson complete, calculates accurate progress,
 * awards +2 XP per lesson and +25 XP upon course completion.
 */
export async function completeLesson(req, res) {
    const client = await pool.connect();
    try {
        const userId = req.user.id;
        const { lessonId } = req.params;

        if (!lessonId || !UUID_REGEX.test(lessonId)) {
            return res.status(400).json({
                success: false,
                message: "Valid lesson UUID is required",
            });
        }

        // 1. Verify lesson exists and get course details
        const lessonRes = await client.query(
            `SELECT l.id, l.title, l.slug, s.course_id, c.title AS course_title, c.is_published
             FROM course_lessons l
             JOIN course_sections s ON l.section_id = s.id
             JOIN courses c ON s.course_id = c.id
             WHERE l.id = $1`,
            [lessonId]
        );

        if (lessonRes.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Lesson not found",
            });
        }

        const lesson = lessonRes.rows[0];

        // 2. Verify course is published
        if (!lesson.is_published) {
            return res.status(400).json({
                success: false,
                message: "Cannot complete lessons in an unpublished course",
            });
        }

        // 3. Verify user is enrolled
        const enrollRes = await client.query(
            `SELECT id, progress_percent, status, completed_at
             FROM course_enrollments
             WHERE course_id = $1 AND user_id = $2`,
            [lesson.course_id, userId]
        );

        if (enrollRes.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: "You must be enrolled in this course to complete its lessons",
            });
        }

        const enrollment = enrollRes.rows[0];

        // 4. Check if lesson was already completed
        const existingProgRes = await client.query(
            "SELECT completed FROM course_lesson_progress WHERE user_id = $1 AND lesson_id = $2",
            [userId, lessonId]
        );

        const wasAlreadyCompleted = existingProgRes.rows.length > 0 && existingProgRes.rows[0].completed;

        await client.query("BEGIN");

        // 5. Upsert course_lesson_progress
        await client.query(
            `INSERT INTO course_lesson_progress (
                user_id, lesson_id, completed, completed_at, last_accessed_at, created_at, updated_at
            )
            VALUES ($1, $2, true, NOW(), NOW(), NOW(), NOW())
            ON CONFLICT (user_id, lesson_id) DO UPDATE SET
                completed = true,
                completed_at = COALESCE(course_lesson_progress.completed_at, NOW()),
                last_accessed_at = NOW(),
                updated_at = NOW()`,
            [userId, lessonId]
        );

        let awardedXp = 0;
        let isCourseNewlyCompleted = false;

        // 6. Award +2 XP if newly completed
        if (!wasAlreadyCompleted) {
            awardedXp += 2;

            // Ensure student_progress exists and add 2 XP
            await client.query(
                `INSERT INTO student_progress (
                    user_id, total_xp, current_streak, longest_streak,
                    problems_solved, courses_completed, projects_completed,
                    created_at, updated_at
                )
                VALUES ($1, 2, 0, 0, 0, 0, 0, NOW(), NOW())
                ON CONFLICT (user_id) DO UPDATE SET
                    total_xp = student_progress.total_xp + 2,
                    updated_at = NOW()`,
                [userId]
            );

            // Record lesson_completed activity
            await client.query(
                `INSERT INTO user_activity (
                    user_id, activity_type, title, description, xp_earned, metadata, created_at
                )
                VALUES ($1, 'lesson_completed', $2, $3, $4, $5, NOW())`,
                [
                    userId,
                    `Completed lesson ${lesson.title}`,
                    `Finished lesson "${lesson.title}" in ${lesson.course_title}`,
                    2,
                    JSON.stringify({
                        lessonId,
                        courseId: lesson.course_id,
                        lessonTitle: lesson.title,
                    }),
                ]
            );
        }

        // 7. Calculate real course progress
        const totalLessonsRes = await client.query(
            `SELECT COUNT(l.id)::int AS count
             FROM course_lessons l
             JOIN course_sections s ON l.section_id = s.id
             WHERE s.course_id = $1`,
            [lesson.course_id]
        );
        const totalLessons = totalLessonsRes.rows[0]?.count || 1;

        const completedLessonsRes = await client.query(
            `SELECT COUNT(p.lesson_id)::int AS count
             FROM course_lesson_progress p
             JOIN course_lessons l ON p.lesson_id = l.id
             JOIN course_sections s ON l.section_id = s.id
             WHERE s.course_id = $1 AND p.user_id = $2 AND p.completed = true`,
            [lesson.course_id, userId]
        );
        const completedLessons = completedLessonsRes.rows[0]?.count || 0;

        const calculatedProgress = Math.min(100, Math.round((completedLessons / totalLessons) * 100));

        // 8. Check course completion transition
        const shouldMarkCourseCompleted = (completedLessons >= totalLessons) && (enrollment.status !== "completed");

        if (shouldMarkCourseCompleted) {
            isCourseNewlyCompleted = true;
            awardedXp += 25;

            // Update course_enrollments
            await client.query(
                `UPDATE course_enrollments
                 SET progress_percent = 100,
                     status = 'completed',
                     completed_at = NOW(),
                     updated_at = NOW()
                 WHERE id = $1`,
                [enrollment.id]
            );

            // Increment student_progress.courses_completed and add 25 XP
            await client.query(
                `UPDATE student_progress
                 SET total_xp = total_xp + 25,
                     courses_completed = courses_completed + 1,
                     updated_at = NOW()
                 WHERE user_id = $1`,
                [userId]
            );

            // Record course_completed activity
            await client.query(
                `INSERT INTO user_activity (
                    user_id, activity_type, title, description, xp_earned, metadata, created_at
                )
                VALUES ($1, 'course_completed', $2, $3, $4, $5, NOW())`,
                [
                    userId,
                    `Completed course ${lesson.course_title}`,
                    `Successfully finished all ${totalLessons} lessons in "${lesson.course_title}"`,
                    25,
                    JSON.stringify({
                        courseId: lesson.course_id,
                        courseTitle: lesson.course_title,
                        totalLessons,
                    }),
                ]
            );

            // Create notification for course completion inside transaction
            await createNotification({
                client,
                userId,
                type: "course_completed",
                title: "Course completed",
                message: `You completed ${lesson.course_title}.`,
                link: `/courses`,
                metadata: {
                    courseId: lesson.course_id,
                    courseTitle: lesson.course_title,
                },
                eventKey: `course_completed:${userId}:${lesson.course_id}`,
            });
        } else {
            // Update enrollment progress percentage
            await client.query(
                `UPDATE course_enrollments
                 SET progress_percent = $1,
                     updated_at = NOW()
                 WHERE id = $2`,
                [calculatedProgress, enrollment.id]
            );
        }

        await client.query("COMMIT");

        // 9. Trigger achievements evaluation outside transaction
        if (awardedXp > 0) {
            evaluateAchievements(userId).catch((err) =>
                console.error("evaluateAchievements error in completeLesson:", err)
            );
        }

        return res.status(200).json({
            success: true,
            message: wasAlreadyCompleted
                ? "Lesson already marked completed"
                : isCourseNewlyCompleted
                ? "Lesson and course completed successfully!"
                : "Lesson completed successfully!",
            completed: true,
            progressPercent: isCourseNewlyCompleted ? 100 : calculatedProgress,
            courseStatus: isCourseNewlyCompleted ? "completed" : enrollment.status,
            awardedXp,
            wasAlreadyCompleted,
            courseNewlyCompleted: isCourseNewlyCompleted,
        });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("completeLesson error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to complete lesson",
        });
    } finally {
        client.release();
    }
}
