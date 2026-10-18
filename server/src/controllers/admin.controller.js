import pool from "../db.js";
import { recordAdminAction, getAuditLogs } from "../services/adminAudit.service.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(id) {
    return typeof id === "string" && UUID_REGEX.test(id);
}

// ============================================================================
// 1. ADMIN DASHBOARD STATS
// ============================================================================
export async function getAdminStats(req, res) {
    try {
        const [
            usersRes,
            coursesRes,
            jobsRes,
            codingRes,
            submissionsRes,
            projectsRes,
            freelanceProjectsRes,
            freelanceContractsRes,
            applicationsRes,
            notificationsRes,
            recentAuditRes,
        ] = await Promise.all([
            pool.query(`
                SELECT 
                    COUNT(*)::int AS total_users,
                    COUNT(*) FILTER (WHERE role = 'student')::int AS total_students,
                    COUNT(*) FILTER (WHERE role = 'admin')::int AS total_admins
                FROM users
            `),
            pool.query(`
                SELECT 
                    COUNT(*)::int AS total_courses,
                    COUNT(*) FILTER (WHERE is_published = true)::int AS published_courses
                FROM courses
            `),
            pool.query(`
                SELECT 
                    COUNT(*)::int AS total_jobs,
                    COUNT(*) FILTER (WHERE is_active = true)::int AS active_jobs
                FROM jobs
            `),
            pool.query(`
                SELECT COUNT(*)::int AS total_problems
                FROM coding_problems
            `),
            pool.query(`
                SELECT COUNT(*)::int AS total_submissions
                FROM coding_submissions
            `),
            pool.query(`
                SELECT COUNT(*)::int AS total_projects
                FROM projects
            `),
            pool.query(`
                SELECT 
                    COUNT(*)::int AS total_freelance_projects,
                    COUNT(*) FILTER (WHERE status = 'open')::int AS open_freelance_projects
                FROM freelance_projects
            `),
            pool.query(`
                SELECT 
                    COUNT(*)::int AS total_contracts,
                    COUNT(*) FILTER (WHERE status = 'active')::int AS active_contracts
                FROM freelance_contracts
            `),
            pool.query(`
                SELECT COUNT(*)::int AS total_applications
                FROM job_applications
            `),
            pool.query(`
                SELECT 
                    COUNT(*)::int AS total_notifications,
                    COUNT(*) FILTER (WHERE is_read = false)::int AS unread_notifications
                FROM notifications
            `),
            pool.query(`
                SELECT 
                    l.id, l.action, l.entity_type, l.entity_id, l.created_at,
                    u.name AS admin_name, u.email AS admin_email
                FROM admin_audit_logs l
                JOIN users u ON l.admin_id = u.id
                ORDER BY l.created_at DESC
                LIMIT 5
            `),
        ]);

        const u = usersRes.rows[0] || {};
        const c = coursesRes.rows[0] || {};
        const j = jobsRes.rows[0] || {};
        const cp = codingRes.rows[0] || {};
        const cs = submissionsRes.rows[0] || {};
        const p = projectsRes.rows[0] || {};
        const fp = freelanceProjectsRes.rows[0] || {};
        const fc = freelanceContractsRes.rows[0] || {};
        const ja = applicationsRes.rows[0] || {};
        const n = notificationsRes.rows[0] || {};

        return res.status(200).json({
            success: true,
            data: {
                totalUsers: u.total_users || 0,
                totalStudents: u.total_students || 0,
                totalAdmins: u.total_admins || 0,
                totalCourses: c.total_courses || 0,
                publishedCourses: c.published_courses || 0,
                totalJobs: j.total_jobs || 0,
                activeJobs: j.active_jobs || 0,
                totalCodingProblems: cp.total_problems || 0,
                totalSubmissions: cs.total_submissions || 0,
                totalProjects: p.total_projects || 0,
                totalFreelanceProjects: fp.total_freelance_projects || 0,
                openFreelanceProjects: fp.open_freelance_projects || 0,
                totalFreelanceContracts: fc.total_contracts || 0,
                activeFreelanceContracts: fc.active_contracts || 0,
                totalApplications: ja.total_applications || 0,
                totalNotifications: n.total_notifications || 0,
                unreadNotifications: n.unread_notifications || 0,
                recentActivity: recentAuditRes.rows.map((row) => ({
                    id: row.id,
                    action: row.action,
                    entityType: row.entity_type,
                    entityId: row.entity_id,
                    adminName: row.admin_name,
                    adminEmail: row.admin_email,
                    createdAt: row.created_at,
                })),
            },
        });
    } catch (error) {
        console.error("getAdminStats error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve administrative statistics",
        });
    }
}

// ============================================================================
// 2. USER MANAGEMENT
// ============================================================================
export async function getUsers(req, res) {
    try {
        const {
            search,
            role,
            status,
            page = 1,
            limit = 20,
            sortBy = "createdAt",
            sortOrder = "DESC",
        } = req.query;

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
        const offset = (pageNum - 1) * limitNum;

        const conditions = [];
        const params = [];

        if (search && typeof search === "string" && search.trim()) {
            params.push(`%${search.trim().toLowerCase()}%`);
            conditions.push(`(LOWER(u.name) LIKE $${params.length} OR LOWER(u.email) LIKE $${params.length})`);
        }

        if (role && (role === "student" || role === "admin")) {
            params.push(role);
            conditions.push(`u.role = $${params.length}`);
        }

        if (status && (status === "active" || status === "suspended")) {
            params.push(status);
            conditions.push(`u.status = $${params.length}`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        // Sort column mapping (strict whitelist to prevent injection)
        const sortColumnMap = {
            createdat: "u.created_at",
            name: "u.name",
            email: "u.email",
            status: "u.status",
            role: "u.role",
        };

        const sortCol = sortColumnMap[sortBy.toLowerCase()] || "u.created_at";
        const sortDir = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

        const countQuery = `
            SELECT COUNT(*)::int AS count
            FROM users u
            ${whereClause}
        `;
        const countRes = await pool.query(countQuery, params);
        const total = countRes.rows[0]?.count || 0;

        const queryParams = [...params, limitNum, offset];
        const dataQuery = `
            SELECT 
                u.id,
                u.name,
                u.email,
                u.role,
                u.status,
                u.created_at,
                p.college,
                p.degree
            FROM users u
            LEFT JOIN profiles p ON u.id = p.id
            ${whereClause}
            ORDER BY ${sortCol} ${sortDir}
            LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
        `;

        const result = await pool.query(dataQuery, queryParams);

        const users = result.rows.map((row) => ({
            id: row.id,
            name: row.name,
            email: row.email,
            role: row.role,
            status: row.status,
            createdAt: row.created_at,
            college: row.college || null,
            degree: row.degree || null,
        }));

        return res.status(200).json({
            success: true,
            data: {
                users,
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(total / limitNum) || 1,
                },
            },
        });
    } catch (error) {
        console.error("getUsers error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve users",
        });
    }
}

export async function getUserDetail(req, res) {
    try {
        const { id } = req.params;

        if (!isValidUuid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID format",
            });
        }

        const userRes = await pool.query(
            `SELECT id, name, email, role, status, created_at, updated_at
             FROM users WHERE id = $1`,
            [id]
        );

        if (userRes.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const user = userRes.rows[0];

        // Fetch detailed profile, skills, progress, achievements, projects, applications, freelance
        const [
            profileRes,
            skillsRes,
            progressRes,
            achievementsRes,
            projectsRes,
            enrollmentsRes,
            applicationsRes,
            freelanceProjectsRes,
            freelanceProposalsRes,
            freelanceContractsRes,
        ] = await Promise.all([
            pool.query(
                `SELECT bio, phone, location, college, degree, graduation_year, avatar_url, github_url, linkedin_url, portfolio_url
                 FROM profiles WHERE id = $1`,
                [id]
            ),
            pool.query(
                `SELECT id, name, category, proficiency FROM skills WHERE user_id = $1 ORDER BY name ASC`,
                [id]
            ),
            pool.query(
                `SELECT total_xp, current_streak, longest_streak, problems_solved, courses_completed, projects_completed
                 FROM student_progress WHERE user_id = $1`,
                [id]
            ),
            pool.query(
                `SELECT a.code, a.title, a.reward_xp, ua.unlocked_at
                 FROM user_achievements ua
                 JOIN achievements a ON ua.achievement_id = a.id
                 WHERE ua.user_id = $1
                 ORDER BY ua.unlocked_at DESC`,
                [id]
            ),
            pool.query(
                `SELECT id, title, project_type, status, is_public, created_at
                 FROM projects WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10`,
                [id]
            ),
            pool.query(
                `SELECT ce.status, ce.progress_percent, ce.enrolled_at, c.title AS course_title
                 FROM course_enrollments ce
                 JOIN courses c ON ce.course_id = c.id
                 WHERE ce.user_id = $1 ORDER BY ce.enrolled_at DESC LIMIT 10`,
                [id]
            ),
            pool.query(
                `SELECT ja.status, ja.applied_at, j.title AS job_title, j.company_name
                 FROM job_applications ja
                 JOIN jobs j ON ja.job_id = j.id
                 WHERE ja.user_id = $1 ORDER BY ja.applied_at DESC LIMIT 10`,
                [id]
            ),
            pool.query(
                `SELECT id, title, status, budget_min, budget_max, created_at
                 FROM freelance_projects WHERE client_id = $1 ORDER BY created_at DESC LIMIT 5`,
                [id]
            ),
            pool.query(
                `SELECT fp.status, fp.proposed_amount, p.title AS project_title, fp.created_at
                 FROM freelance_proposals fp
                 JOIN freelance_projects p ON fp.project_id = p.id
                 WHERE fp.freelancer_id = $1 ORDER BY fp.created_at DESC LIMIT 5`,
                [id]
            ),
            pool.query(
                `SELECT fc.status, fc.agreed_amount, p.title AS project_title, fc.started_at
                 FROM freelance_contracts fc
                 JOIN freelance_projects p ON fc.project_id = p.id
                 WHERE fc.freelancer_id = $1 OR fc.client_id = $1 ORDER BY fc.started_at DESC LIMIT 5`,
                [id]
            ),
        ]);

        const progress = progressRes.rows[0] || {
            total_xp: 0,
            current_streak: 0,
            longest_streak: 0,
            problems_solved: 0,
            courses_completed: 0,
            projects_completed: 0,
        };

        return res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    status: user.status,
                    createdAt: user.created_at,
                    updatedAt: user.updated_at,
                },
                profile: profileRes.rows[0] || null,
                skills: skillsRes.rows,
                progress: {
                    totalXp: progress.total_xp,
                    currentStreak: progress.current_streak,
                    longestStreak: progress.longest_streak,
                    problemsSolved: progress.problems_solved,
                    coursesCompleted: progress.courses_completed,
                    projectsCompleted: progress.projects_completed,
                },
                achievements: achievementsRes.rows,
                projects: projectsRes.rows,
                courses: enrollmentsRes.rows,
                applications: applicationsRes.rows,
                freelance: {
                    clientProjects: freelanceProjectsRes.rows,
                    proposals: freelanceProposalsRes.rows,
                    contracts: freelanceContractsRes.rows,
                },
            },
        });
    } catch (error) {
        console.error("getUserDetail error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve user details",
        });
    }
}

export async function updateUserStatus(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!isValidUuid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID format",
            });
        }

        if (!status || (status !== "active" && status !== "suspended")) {
            return res.status(400).json({
                success: false,
                message: "Status must be either 'active' or 'suspended'",
            });
        }

        const userCheck = await pool.query(
            "SELECT id, name, email, role, status FROM users WHERE id = $1",
            [id]
        );

        if (userCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const targetUser = userCheck.rows[0];

        // Guard: Prevent suspending the last active administrator
        if (targetUser.role === "admin" && status === "suspended") {
            const adminCountRes = await pool.query(
                "SELECT COUNT(*)::int AS count FROM users WHERE role = 'admin' AND status = 'active'"
            );
            const activeAdmins = adminCountRes.rows[0]?.count || 0;
            if (activeAdmins <= 1) {
                return res.status(400).json({
                    success: false,
                    message: "Cannot suspend the final active administrator",
                });
            }
        }

        const updateRes = await pool.query(
            `UPDATE users
             SET status = $1, updated_at = NOW()
             WHERE id = $2
             RETURNING id, name, email, role, status, updated_at`,
            [status, id]
        );

        const updatedUser = updateRes.rows[0];

        // Audit log entry
        await recordAdminAction({
            adminId: req.user.id,
            action: status === "suspended" ? "USER_SUSPENDED" : "USER_REACTIVATED",
            entityType: "user",
            entityId: id,
            details: {
                userEmail: targetUser.email,
                userName: targetUser.name,
                previousStatus: targetUser.status,
                newStatus: status,
            },
        });

        return res.status(200).json({
            success: true,
            message: `User status successfully updated to ${status}`,
            data: updatedUser,
        });
    } catch (error) {
        console.error("updateUserStatus error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update user status",
        });
    }
}

export async function updateUserRole(req, res) {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!isValidUuid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID format",
            });
        }

        if (!role || (role !== "student" && role !== "admin")) {
            return res.status(400).json({
                success: false,
                message: "Role must be either 'student' or 'admin'",
            });
        }

        const userCheck = await pool.query(
            "SELECT id, name, email, role, status FROM users WHERE id = $1",
            [id]
        );

        if (userCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const targetUser = userCheck.rows[0];

        // Guard: Prevent demoting the last active administrator
        if (targetUser.role === "admin" && role === "student") {
            const adminCountRes = await pool.query(
                "SELECT COUNT(*)::int AS count FROM users WHERE role = 'admin' AND status = 'active'"
            );
            const activeAdmins = adminCountRes.rows[0]?.count || 0;
            if (activeAdmins <= 1) {
                return res.status(400).json({
                    success: false,
                    message: "Cannot demote the final active administrator",
                });
            }
        }

        const updateRes = await pool.query(
            `UPDATE users
             SET role = $1, updated_at = NOW()
             WHERE id = $2
             RETURNING id, name, email, role, status, updated_at`,
            [role, id]
        );

        const updatedUser = updateRes.rows[0];

        // Audit log entry
        await recordAdminAction({
            adminId: req.user.id,
            action: "USER_ROLE_CHANGED",
            entityType: "user",
            entityId: id,
            details: {
                userEmail: targetUser.email,
                userName: targetUser.name,
                previousRole: targetUser.role,
                newRole: role,
            },
        });

        return res.status(200).json({
            success: true,
            message: `User role successfully updated to ${role}`,
            data: updatedUser,
        });
    } catch (error) {
        console.error("updateUserRole error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update user role",
        });
    }
}

// ============================================================================
// 3. COURSE MANAGEMENT
// ============================================================================
export async function getAdminCourses(req, res) {
    try {
        const {
            search,
            category,
            level,
            isPublished,
            page = 1,
            limit = 20,
        } = req.query;

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
        const offset = (pageNum - 1) * limitNum;

        const conditions = [];
        const params = [];

        if (search && typeof search === "string" && search.trim()) {
            params.push(`%${search.trim().toLowerCase()}%`);
            conditions.push(`(LOWER(c.title) LIKE $${params.length} OR LOWER(c.instructor_name) LIKE $${params.length})`);
        }

        if (category && typeof category === "string" && category.trim()) {
            params.push(category.trim());
            conditions.push(`c.category = $${params.length}`);
        }

        if (level && typeof level === "string" && level.trim()) {
            params.push(level.trim().toLowerCase());
            conditions.push(`c.level = $${params.length}`);
        }

        if (isPublished !== undefined && isPublished !== "") {
            const isPub = isPublished === "true" || isPublished === true;
            params.push(isPub);
            conditions.push(`c.is_published = $${params.length}`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        const countRes = await pool.query(
            `SELECT COUNT(*)::int AS count FROM courses c ${whereClause}`,
            params
        );
        const total = countRes.rows[0]?.count || 0;

        const queryParams = [...params, limitNum, offset];
        const dataQuery = `
            SELECT 
                c.id,
                c.title,
                c.slug,
                c.category,
                c.level,
                c.instructor_name,
                c.duration_minutes,
                c.is_published,
                c.created_at,
                c.updated_at,
                COUNT(DISTINCT s.id)::int AS section_count,
                COUNT(DISTINCT l.id)::int AS lesson_count,
                COUNT(DISTINCT e.id)::int AS enrollment_count
            FROM courses c
            LEFT JOIN course_sections s ON c.id = s.course_id
            LEFT JOIN course_lessons l ON s.id = l.section_id
            LEFT JOIN course_enrollments e ON c.id = e.course_id
            ${whereClause}
            GROUP BY c.id
            ORDER BY c.created_at DESC
            LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
        `;

        const result = await pool.query(dataQuery, queryParams);

        return res.status(200).json({
            success: true,
            data: {
                courses: result.rows.map((row) => ({
                    id: row.id,
                    title: row.title,
                    slug: row.slug,
                    category: row.category,
                    level: row.level,
                    instructorName: row.instructor_name,
                    durationMinutes: row.duration_minutes,
                    isPublished: row.is_published,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at,
                    sectionCount: row.section_count,
                    lessonCount: row.lesson_count,
                    enrollmentCount: row.enrollment_count,
                })),
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(total / limitNum) || 1,
                },
            },
        });
    } catch (error) {
        console.error("getAdminCourses error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve courses for administration",
        });
    }
}

export async function getAdminCourseDetail(req, res) {
    try {
        const { id } = req.params;

        if (!isValidUuid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid course ID format",
            });
        }

        const courseRes = await pool.query(
            `SELECT * FROM courses WHERE id = $1`,
            [id]
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
            `SELECT s.id, s.title, s.description, s.section_order,
                    json_agg(
                        json_build_object(
                            'id', l.id,
                            'title', l.title,
                            'slug', l.slug,
                            'lesson_order', l.lesson_order,
                            'duration_minutes', l.duration_minutes,
                            'lesson_type', l.lesson_type,
                            'is_preview', l.is_preview
                        ) ORDER BY l.lesson_order ASC
                    ) FILTER (WHERE l.id IS NOT NULL) AS lessons
             FROM course_sections s
             LEFT JOIN course_lessons l ON s.id = l.section_id
             WHERE s.course_id = $1
             GROUP BY s.id
             ORDER BY s.section_order ASC`,
            [id]
        );

        // Fetch enrollment count
        const enrollCountRes = await pool.query(
            `SELECT COUNT(*)::int AS count FROM course_enrollments WHERE course_id = $1`,
            [id]
        );

        return res.status(200).json({
            success: true,
            data: {
                ...course,
                enrollmentCount: enrollCountRes.rows[0]?.count || 0,
                sections: sectionsRes.rows.map((s) => ({
                    ...s,
                    lessons: s.lessons || [],
                })),
            },
        });
    } catch (error) {
        console.error("getAdminCourseDetail error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve course details",
        });
    }
}

export async function publishCourse(req, res) {
    try {
        const { id } = req.params;

        if (!isValidUuid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid course ID format",
            });
        }

        const updateRes = await pool.query(
            `UPDATE courses
             SET is_published = true, updated_at = NOW()
             WHERE id = $1
             RETURNING id, title, slug, is_published, updated_at`,
            [id]
        );

        if (updateRes.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Course not found",
            });
        }

        const course = updateRes.rows[0];

        await recordAdminAction({
            adminId: req.user.id,
            action: "COURSE_PUBLISHED",
            entityType: "course",
            entityId: id,
            details: { title: course.title, slug: course.slug },
        });

        return res.status(200).json({
            success: true,
            message: "Course successfully published",
            data: course,
        });
    } catch (error) {
        console.error("publishCourse error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to publish course",
        });
    }
}

export async function unpublishCourse(req, res) {
    try {
        const { id } = req.params;

        if (!isValidUuid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid course ID format",
            });
        }

        const updateRes = await pool.query(
            `UPDATE courses
             SET is_published = false, updated_at = NOW()
             WHERE id = $1
             RETURNING id, title, slug, is_published, updated_at`,
            [id]
        );

        if (updateRes.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Course not found",
            });
        }

        const course = updateRes.rows[0];

        await recordAdminAction({
            adminId: req.user.id,
            action: "COURSE_UNPUBLISHED",
            entityType: "course",
            entityId: id,
            details: { title: course.title, slug: course.slug },
        });

        return res.status(200).json({
            success: true,
            message: "Course successfully unpublished",
            data: course,
        });
    } catch (error) {
        console.error("unpublishCourse error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to unpublish course",
        });
    }
}

// ============================================================================
// 4. JOB MANAGEMENT
// ============================================================================
export async function getAdminJobs(req, res) {
    try {
        const {
            search,
            jobType,
            isActive,
            page = 1,
            limit = 20,
        } = req.query;

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
        const offset = (pageNum - 1) * limitNum;

        const conditions = [];
        const params = [];

        if (search && typeof search === "string" && search.trim()) {
            params.push(`%${search.trim().toLowerCase()}%`);
            conditions.push(`(LOWER(j.title) LIKE $${params.length} OR LOWER(j.company_name) LIKE $${params.length})`);
        }

        if (jobType && (jobType === "job" || jobType === "internship")) {
            params.push(jobType);
            conditions.push(`j.job_type = $${params.length}`);
        }

        if (isActive !== undefined && isActive !== "") {
            const isAct = isActive === "true" || isActive === true;
            params.push(isAct);
            conditions.push(`j.is_active = $${params.length}`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        const countRes = await pool.query(
            `SELECT COUNT(*)::int AS count FROM jobs j ${whereClause}`,
            params
        );
        const total = countRes.rows[0]?.count || 0;

        const queryParams = [...params, limitNum, offset];
        const dataQuery = `
            SELECT 
                j.id,
                j.title,
                j.company_name,
                j.company_logo_url,
                j.job_type,
                j.employment_type,
                j.location,
                j.work_mode,
                j.salary_min,
                j.salary_max,
                j.salary_currency,
                j.application_deadline,
                j.is_active,
                j.created_at,
                COUNT(a.id)::int AS application_count
            FROM jobs j
            LEFT JOIN job_applications a ON j.id = a.job_id
            ${whereClause}
            GROUP BY j.id
            ORDER BY j.created_at DESC
            LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
        `;

        const result = await pool.query(dataQuery, queryParams);

        return res.status(200).json({
            success: true,
            data: {
                jobs: result.rows.map((row) => ({
                    id: row.id,
                    title: row.title,
                    companyName: row.company_name,
                    companyLogoUrl: row.company_logo_url,
                    jobType: row.job_type,
                    employmentType: row.employment_type,
                    location: row.location,
                    workMode: row.work_mode,
                    salaryMin: row.salary_min,
                    salaryMax: row.salary_max,
                    salaryCurrency: row.salary_currency,
                    applicationDeadline: row.application_deadline,
                    isActive: row.is_active,
                    createdAt: row.created_at,
                    applicationCount: row.application_count,
                })),
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(total / limitNum) || 1,
                },
            },
        });
    } catch (error) {
        console.error("getAdminJobs error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve jobs for administration",
        });
    }
}

export async function getAdminJobDetail(req, res) {
    try {
        const { id } = req.params;

        if (!isValidUuid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid job ID format",
            });
        }

        const jobRes = await pool.query("SELECT * FROM jobs WHERE id = $1", [id]);

        if (jobRes.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Job not found",
            });
        }

        const job = jobRes.rows[0];

        const appsRes = await pool.query(
            `SELECT a.id, a.user_id, a.status, a.applied_at, u.name AS applicant_name, u.email AS applicant_email
             FROM job_applications a
             JOIN users u ON a.user_id = u.id
             WHERE a.job_id = $1
             ORDER BY a.applied_at DESC
             LIMIT 20`,
            [id]
        );

        return res.status(200).json({
            success: true,
            data: {
                ...job,
                applicationCount: appsRes.rows.length,
                applications: appsRes.rows,
            },
        });
    } catch (error) {
        console.error("getAdminJobDetail error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve job details",
        });
    }
}

export async function updateJobStatus(req, res) {
    try {
        const { id } = req.params;
        const { status, isActive } = req.body;

        if (!isValidUuid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid job ID format",
            });
        }

        let newActive;
        if (isActive !== undefined) {
            newActive = Boolean(isActive);
        } else if (status !== undefined) {
            if (status === "active") newActive = true;
            else if (status === "inactive") newActive = false;
            else {
                return res.status(400).json({
                    success: false,
                    message: "Status must be 'active' or 'inactive'",
                });
            }
        } else {
            return res.status(400).json({
                success: false,
                message: "Must provide status ('active'/'inactive') or isActive boolean",
            });
        }

        const updateRes = await pool.query(
            `UPDATE jobs
             SET is_active = $1, updated_at = NOW()
             WHERE id = $2
             RETURNING id, title, company_name, is_active, updated_at`,
            [newActive, id]
        );

        if (updateRes.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Job not found",
            });
        }

        const job = updateRes.rows[0];

        await recordAdminAction({
            adminId: req.user.id,
            action: newActive ? "JOB_ACTIVATED" : "JOB_DEACTIVATED",
            entityType: "job",
            entityId: id,
            details: { title: job.title, company: job.company_name, isActive: newActive },
        });

        return res.status(200).json({
            success: true,
            message: `Job successfully ${newActive ? "activated" : "deactivated"}`,
            data: job,
        });
    } catch (error) {
        console.error("updateJobStatus error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update job status",
        });
    }
}

// ============================================================================
// 5. CODING PROBLEM MANAGEMENT
// ============================================================================
export async function getAdminCodingProblems(req, res) {
    try {
        const {
            search,
            difficulty,
            category,
            isActive,
            page = 1,
            limit = 20,
        } = req.query;

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
        const offset = (pageNum - 1) * limitNum;

        const conditions = [];
        const params = [];

        if (search && typeof search === "string" && search.trim()) {
            params.push(`%${search.trim().toLowerCase()}%`);
            conditions.push(`(LOWER(cp.title) LIKE $${params.length} OR LOWER(cp.slug) LIKE $${params.length})`);
        }

        if (difficulty && ["Easy", "Medium", "Hard"].includes(difficulty)) {
            params.push(difficulty);
            conditions.push(`cp.difficulty = $${params.length}`);
        }

        if (category && typeof category === "string" && category.trim()) {
            params.push(category.trim());
            conditions.push(`cp.category = $${params.length}`);
        }

        if (isActive !== undefined && isActive !== "") {
            const isAct = isActive === "true" || isActive === true;
            params.push(isAct);
            conditions.push(`cp.is_active = $${params.length}`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        const countRes = await pool.query(
            `SELECT COUNT(*)::int AS count FROM coding_problems cp ${whereClause}`,
            params
        );
        const total = countRes.rows[0]?.count || 0;

        const queryParams = [...params, limitNum, offset];
        const dataQuery = `
            SELECT 
                cp.id,
                cp.title,
                cp.slug,
                cp.difficulty,
                cp.category,
                cp.is_published,
                cp.is_active,
                cp.created_at,
                COUNT(DISTINCT tc.id)::int AS test_case_count,
                COUNT(DISTINCT cs.id)::int AS submission_count
            FROM coding_problems cp
            LEFT JOIN coding_test_cases tc ON cp.id = tc.problem_id
            LEFT JOIN coding_submissions cs ON cp.id = cs.problem_id
            ${whereClause}
            GROUP BY cp.id
            ORDER BY cp.created_at DESC
            LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
        `;

        const result = await pool.query(dataQuery, queryParams);

        return res.status(200).json({
            success: true,
            data: {
                problems: result.rows.map((row) => ({
                    id: row.id,
                    title: row.title,
                    slug: row.slug,
                    difficulty: row.difficulty,
                    category: row.category,
                    isPublished: row.is_published,
                    isActive: row.is_active,
                    createdAt: row.created_at,
                    testCaseCount: row.test_case_count,
                    submissionCount: row.submission_count,
                })),
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(total / limitNum) || 1,
                },
            },
        });
    } catch (error) {
        console.error("getAdminCodingProblems error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve coding problems",
        });
    }
}

export async function getAdminCodingProblemDetail(req, res) {
    try {
        const { id } = req.params;

        if (!isValidUuid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid problem ID format",
            });
        }

        const probRes = await pool.query(
            "SELECT * FROM coding_problems WHERE id = $1",
            [id]
        );

        if (probRes.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Coding problem not found",
            });
        }

        const problem = probRes.rows[0];

        // Safe test case info: count total and only return sample test cases without exposing full hidden test suites unnecessarily
        const testCasesRes = await pool.query(
            `SELECT 
                COUNT(*)::int AS total_test_cases,
                COUNT(*) FILTER (WHERE is_sample = true)::int AS sample_test_cases,
                COUNT(*) FILTER (WHERE is_hidden = true)::int AS hidden_test_cases
             FROM coding_test_cases
             WHERE problem_id = $1`,
            [id]
        );

        const sampleCasesRes = await pool.query(
            `SELECT id, input_data, expected_output, test_order
             FROM coding_test_cases
             WHERE problem_id = $1 AND is_sample = true
             ORDER BY test_order ASC`,
            [id]
        );

        const submissionsCountRes = await pool.query(
            `SELECT 
                COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE status = 'accepted')::int AS accepted
             FROM coding_submissions
             WHERE problem_id = $1`,
            [id]
        );

        return res.status(200).json({
            success: true,
            data: {
                id: problem.id,
                title: problem.title,
                slug: problem.slug,
                description: problem.description,
                difficulty: problem.difficulty,
                category: problem.category,
                tags: problem.tags,
                constraints: problem.constraints,
                inputFormat: problem.input_format,
                outputFormat: problem.output_format,
                examples: problem.examples,
                isPublished: problem.is_published,
                isActive: problem.is_active,
                createdAt: problem.created_at,
                updatedAt: problem.updated_at,
                testCaseStats: testCasesRes.rows[0] || {
                    total_test_cases: 0,
                    sample_test_cases: 0,
                    hidden_test_cases: 0,
                },
                sampleTestCases: sampleCasesRes.rows,
                submissions: submissionsCountRes.rows[0] || { total: 0, accepted: 0 },
            },
        });
    } catch (error) {
        console.error("getAdminCodingProblemDetail error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve coding problem details",
        });
    }
}

export async function updateCodingProblemStatus(req, res) {
    try {
        const { id } = req.params;
        const { status, isActive } = req.body;

        if (!isValidUuid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid coding problem ID format",
            });
        }

        let newActive;
        if (isActive !== undefined) {
            newActive = Boolean(isActive);
        } else if (status !== undefined) {
            if (status === "active") newActive = true;
            else if (status === "inactive") newActive = false;
            else {
                return res.status(400).json({
                    success: false,
                    message: "Status must be 'active' or 'inactive'",
                });
            }
        } else {
            return res.status(400).json({
                success: false,
                message: "Must provide status ('active'/'inactive') or isActive boolean",
            });
        }

        const updateRes = await pool.query(
            `UPDATE coding_problems
             SET is_active = $1, is_published = $1, updated_at = NOW()
             WHERE id = $2
             RETURNING id, title, slug, is_active, is_published, updated_at`,
            [newActive, id]
        );

        if (updateRes.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Coding problem not found",
            });
        }

        const problem = updateRes.rows[0];

        await recordAdminAction({
            adminId: req.user.id,
            action: newActive ? "CODING_PROBLEM_ACTIVATED" : "CODING_PROBLEM_DEACTIVATED",
            entityType: "coding_problem",
            entityId: id,
            details: { title: problem.title, slug: problem.slug, isActive: newActive },
        });

        return res.status(200).json({
            success: true,
            message: `Coding problem successfully ${newActive ? "activated" : "deactivated"}`,
            data: problem,
        });
    } catch (error) {
        console.error("updateCodingProblemStatus error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update coding problem status",
        });
    }
}

// ============================================================================
// 6. PROJECT MODERATION
// ============================================================================
export async function getAdminProjects(req, res) {
    try {
        const {
            search,
            projectType,
            status,
            isPublic,
            page = 1,
            limit = 20,
        } = req.query;

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
        const offset = (pageNum - 1) * limitNum;

        const conditions = [];
        const params = [];

        if (search && typeof search === "string" && search.trim()) {
            params.push(`%${search.trim().toLowerCase()}%`);
            conditions.push(`(LOWER(p.title) LIKE $${params.length} OR LOWER(u.name) LIKE $${params.length} OR LOWER(u.email) LIKE $${params.length})`);
        }

        if (projectType && typeof projectType === "string" && projectType.trim()) {
            params.push(projectType.trim());
            conditions.push(`p.project_type = $${params.length}`);
        }

        if (status && typeof status === "string" && status.trim()) {
            params.push(status.trim());
            conditions.push(`p.status = $${params.length}`);
        }

        if (isPublic !== undefined && isPublic !== "") {
            const isPub = isPublic === "true" || isPublic === true;
            params.push(isPub);
            conditions.push(`p.is_public = $${params.length}`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        const countRes = await pool.query(
            `SELECT COUNT(*)::int AS count FROM projects p JOIN users u ON p.user_id = u.id ${whereClause}`,
            params
        );
        const total = countRes.rows[0]?.count || 0;

        const queryParams = [...params, limitNum, offset];
        const dataQuery = `
            SELECT 
                p.id,
                p.user_id,
                p.title,
                p.slug,
                p.project_type,
                p.status,
                p.is_featured,
                p.is_public,
                p.created_at,
                p.updated_at,
                u.name AS owner_name,
                u.email AS owner_email
            FROM projects p
            JOIN users u ON p.user_id = u.id
            ${whereClause}
            ORDER BY p.created_at DESC
            LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
        `;

        const result = await pool.query(dataQuery, queryParams);

        return res.status(200).json({
            success: true,
            data: {
                projects: result.rows.map((row) => ({
                    id: row.id,
                    userId: row.user_id,
                    title: row.title,
                    slug: row.slug,
                    projectType: row.project_type,
                    status: row.status,
                    isFeatured: row.is_featured,
                    isPublic: row.is_public,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at,
                    owner: {
                        name: row.owner_name,
                        email: row.owner_email,
                    },
                })),
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(total / limitNum) || 1,
                },
            },
        });
    } catch (error) {
        console.error("getAdminProjects error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve projects for moderation",
        });
    }
}

export async function getAdminProjectDetail(req, res) {
    try {
        const { id } = req.params;

        if (!isValidUuid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid project ID format",
            });
        }

        const projectRes = await pool.query(
            `SELECT p.*, u.name AS owner_name, u.email AS owner_email
             FROM projects p
             JOIN users u ON p.user_id = u.id
             WHERE p.id = $1`,
            [id]
        );

        if (projectRes.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: projectRes.rows[0],
        });
    } catch (error) {
        console.error("getAdminProjectDetail error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve project details",
        });
    }
}

export async function updateProjectStatus(req, res) {
    try {
        const { id } = req.params;
        const { isPublic, status } = req.body;

        if (!isValidUuid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid project ID format",
            });
        }

        const currentRes = await pool.query(
            "SELECT id, title, is_public, status FROM projects WHERE id = $1",
            [id]
        );

        if (currentRes.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }

        const current = currentRes.rows[0];

        const updates = [];
        const params = [id];

        if (isPublic !== undefined) {
            params.push(Boolean(isPublic));
            updates.push(`is_public = $${params.length}`);
        }

        if (status !== undefined) {
            if (!["planned", "in_progress", "completed"].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid project status. Allowed: planned, in_progress, completed",
                });
            }
            params.push(status);
            updates.push(`status = $${params.length}`);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No moderation fields provided (isPublic or status)",
            });
        }

        updates.push("updated_at = NOW()");

        const updateQuery = `
            UPDATE projects
            SET ${updates.join(", ")}
            WHERE id = $1
            RETURNING id, title, is_public, status, updated_at
        `;

        const updateRes = await pool.query(updateQuery, params);
        const updated = updateRes.rows[0];

        await recordAdminAction({
            adminId: req.user.id,
            action: "PROJECT_MODERATED",
            entityType: "project",
            entityId: id,
            details: {
                title: current.title,
                previousState: { is_public: current.is_public, status: current.status },
                newState: { is_public: updated.is_public, status: updated.status },
            },
        });

        return res.status(200).json({
            success: true,
            message: "Project moderation updated successfully",
            data: updated,
        });
    } catch (error) {
        console.error("updateProjectStatus error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to moderate project",
        });
    }
}

// ============================================================================
// 7. FREELANCE MODERATION
// ============================================================================
export async function getAdminFreelanceProjects(req, res) {
    try {
        const {
            search,
            category,
            status,
            page = 1,
            limit = 20,
        } = req.query;

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
        const offset = (pageNum - 1) * limitNum;

        const conditions = [];
        const params = [];

        if (search && typeof search === "string" && search.trim()) {
            params.push(`%${search.trim().toLowerCase()}%`);
            conditions.push(`(LOWER(fp.title) LIKE $${params.length} OR LOWER(u.name) LIKE $${params.length} OR LOWER(u.email) LIKE $${params.length})`);
        }

        if (category && typeof category === "string" && category.trim()) {
            params.push(category.trim());
            conditions.push(`fp.category = $${params.length}`);
        }

        if (status && ["open", "in_progress", "completed", "cancelled"].includes(status)) {
            params.push(status);
            conditions.push(`fp.status = $${params.length}`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        const countRes = await pool.query(
            `SELECT COUNT(*)::int AS count FROM freelance_projects fp JOIN users u ON fp.client_id = u.id ${whereClause}`,
            params
        );
        const total = countRes.rows[0]?.count || 0;

        const queryParams = [...params, limitNum, offset];
        const dataQuery = `
            SELECT 
                fp.id,
                fp.client_id,
                fp.title,
                fp.category,
                fp.budget_type,
                fp.budget_min,
                fp.budget_max,
                fp.currency,
                fp.status,
                fp.created_at,
                u.name AS client_name,
                u.email AS client_email,
                COUNT(DISTINCT p.id)::int AS proposal_count,
                COUNT(DISTINCT c.id)::int AS contract_count
            FROM freelance_projects fp
            JOIN users u ON fp.client_id = u.id
            LEFT JOIN freelance_proposals p ON fp.id = p.project_id
            LEFT JOIN freelance_contracts c ON fp.id = c.project_id
            ${whereClause}
            GROUP BY fp.id, u.id
            ORDER BY fp.created_at DESC
            LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
        `;

        const result = await pool.query(dataQuery, queryParams);

        return res.status(200).json({
            success: true,
            data: {
                projects: result.rows.map((row) => ({
                    id: row.id,
                    clientId: row.client_id,
                    title: row.title,
                    category: row.category,
                    budgetType: row.budget_type,
                    budgetMin: row.budget_min,
                    budgetMax: row.budget_max,
                    currency: row.currency,
                    status: row.status,
                    createdAt: row.created_at,
                    client: {
                        name: row.client_name,
                        email: row.client_email,
                    },
                    proposalCount: row.proposal_count,
                    contractCount: row.contract_count,
                })),
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(total / limitNum) || 1,
                },
            },
        });
    } catch (error) {
        console.error("getAdminFreelanceProjects error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve freelance projects",
        });
    }
}

export async function getAdminFreelanceProjectDetail(req, res) {
    try {
        const { id } = req.params;

        if (!isValidUuid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid freelance project ID format",
            });
        }

        const projectRes = await pool.query(
            `SELECT fp.*, u.name AS client_name, u.email AS client_email
             FROM freelance_projects fp
             JOIN users u ON fp.client_id = u.id
             WHERE fp.id = $1`,
            [id]
        );

        if (projectRes.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Freelance project not found",
            });
        }

        const project = projectRes.rows[0];

        const [proposalsRes, contractRes] = await Promise.all([
            pool.query(
                `SELECT p.id, p.freelancer_id, p.proposed_amount, p.estimated_days, p.status, p.created_at,
                        u.name AS freelancer_name, u.email AS freelancer_email
                 FROM freelance_proposals p
                 JOIN users u ON p.freelancer_id = u.id
                 WHERE p.project_id = $1
                 ORDER BY p.created_at DESC`,
                [id]
            ),
            pool.query(
                `SELECT c.id, c.agreed_amount, c.currency, c.status, c.started_at, c.completed_at,
                        u.name AS freelancer_name, u.email AS freelancer_email
                 FROM freelance_contracts c
                 JOIN users u ON c.freelancer_id = u.id
                 WHERE c.project_id = $1`,
                [id]
            ),
        ]);

        return res.status(200).json({
            success: true,
            data: {
                ...project,
                proposals: proposalsRes.rows,
                contract: contractRes.rows[0] || null,
            },
        });
    } catch (error) {
        console.error("getAdminFreelanceProjectDetail error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve freelance project details",
        });
    }
}

export async function updateFreelanceProjectStatus(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!isValidUuid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid freelance project ID format",
            });
        }

        if (!status || !["open", "cancelled"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Moderation status must be 'open' or 'cancelled'",
            });
        }

        const checkRes = await pool.query(
            "SELECT id, title, status FROM freelance_projects WHERE id = $1",
            [id]
        );

        if (checkRes.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Freelance project not found",
            });
        }

        const current = checkRes.rows[0];

        const updateRes = await pool.query(
            `UPDATE freelance_projects
             SET status = $1, updated_at = NOW()
             WHERE id = $2
             RETURNING id, title, status, updated_at`,
            [status, id]
        );

        const updated = updateRes.rows[0];

        await recordAdminAction({
            adminId: req.user.id,
            action: status === "cancelled" ? "FREELANCE_PROJECT_CANCELLED" : "FREELANCE_PROJECT_REOPENED",
            entityType: "freelance_project",
            entityId: id,
            details: {
                title: current.title,
                previousStatus: current.status,
                newStatus: status,
            },
        });

        return res.status(200).json({
            success: true,
            message: `Freelance project successfully marked as ${status}`,
            data: updated,
        });
    } catch (error) {
        console.error("updateFreelanceProjectStatus error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update freelance project status",
        });
    }
}

// ============================================================================
// 8. NOTIFICATION OVERVIEW (READ-ONLY)
// ============================================================================
export async function getAdminNotifications(req, res) {
    try {
        const {
            userId,
            type,
            page = 1,
            limit = 20,
        } = req.query;

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
        const offset = (pageNum - 1) * limitNum;

        const conditions = [];
        const params = [];

        if (userId && isValidUuid(userId)) {
            params.push(userId);
            conditions.push(`n.user_id = $${params.length}`);
        }

        if (type && typeof type === "string" && type.trim()) {
            params.push(type.trim());
            conditions.push(`n.type = $${params.length}`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        const countRes = await pool.query(
            `SELECT COUNT(*)::int AS count FROM notifications n ${whereClause}`,
            params
        );
        const total = countRes.rows[0]?.count || 0;

        const queryParams = [...params, limitNum, offset];
        const dataQuery = `
            SELECT 
                n.id,
                n.user_id,
                n.type,
                n.title,
                n.message,
                n.link,
                n.metadata,
                n.is_read,
                n.created_at,
                n.read_at,
                u.name AS recipient_name,
                u.email AS recipient_email
            FROM notifications n
            JOIN users u ON n.user_id = u.id
            ${whereClause}
            ORDER BY n.created_at DESC
            LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
        `;

        const result = await pool.query(dataQuery, queryParams);

        return res.status(200).json({
            success: true,
            data: {
                notifications: result.rows.map((row) => ({
                    id: row.id,
                    userId: row.user_id,
                    recipientName: row.recipient_name,
                    recipientEmail: row.recipient_email,
                    type: row.type,
                    title: row.title,
                    message: row.message,
                    link: row.link,
                    metadata: row.metadata,
                    isRead: row.is_read,
                    createdAt: row.created_at,
                    readAt: row.read_at,
                })),
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(total / limitNum) || 1,
                },
            },
        });
    } catch (error) {
        console.error("getAdminNotifications error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve notifications overview",
        });
    }
}

// ============================================================================
// 9. AUDIT LOGS (READ-ONLY)
// ============================================================================
export async function getAdminAuditLogs(req, res) {
    try {
        const {
            action,
            entityType,
            adminId,
            page = 1,
            limit = 20,
        } = req.query;

        const data = await getAuditLogs({
            action,
            entityType,
            adminId,
            page,
            limit,
        });

        return res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        console.error("getAdminAuditLogs error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve administrative audit logs",
        });
    }
}
