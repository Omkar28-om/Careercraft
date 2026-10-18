import pool from "../db.js";
import { getLevelProgress } from "../utils/xpLevel.js";
import { calculateProfileCompleteness } from "../utils/profileCompleteness.js";

// ======================================================
// GET /api/dashboard
// Fetch authenticated student's real dashboard statistics
// Auto-creates progress row if one does not exist yet.
// ======================================================
export const getDashboardData = async (req, res) => {
    try {
        const userId = req.user.id;

        // Auto-create initial progress row if it doesn't exist yet
        await pool.query(
            `INSERT INTO student_progress (
                user_id, total_xp, current_streak, longest_streak, problems_solved, courses_completed, projects_completed, created_at, updated_at
            )
            VALUES ($1, 0, 0, 0, 0, 0, 0, NOW(), NOW())
            ON CONFLICT (user_id) DO NOTHING`,
            [userId]
        );

        // Query user info and progress row with parameterized query
        const result = await pool.query(
            `SELECT 
                u.id,
                u.name,
                u.email,
                u.role,
                p.total_xp,
                p.current_streak,
                p.longest_streak,
                p.problems_solved,
                p.courses_completed,
                p.projects_completed,
                p.created_at AS progress_created_at,
                p.updated_at AS progress_updated_at
             FROM users u
             JOIN student_progress p ON u.id = p.user_id
             WHERE u.id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const row = result.rows[0];

        // Fetch profile, skills, recent activities, completed projects count, completed courses, enrolled courses, and application stats concurrently
        const [
            profileRes,
            skillsRes,
            activitiesRes,
            completedProjectsRes,
            completedCoursesRes,
            enrolledCoursesRes,
            appSummaryRes,
            recentAppsRes,
            freelanceSummaryRes,
        ] = await Promise.all([
            pool.query(
                `SELECT bio, phone, location, college, degree, graduation_year, avatar_url, github_url, linkedin_url, portfolio_url
                 FROM profiles
                 WHERE id = $1`,
                [userId]
            ),
            pool.query(
                `SELECT id, name, category, proficiency
                 FROM skills
                 WHERE user_id = $1
                 ORDER BY created_at ASC`,
                [userId]
            ),
            pool.query(
                `SELECT 
                    id,
                    user_id,
                    activity_type,
                    title,
                    description,
                    xp_earned,
                    metadata,
                    created_at
                 FROM user_activity
                 WHERE user_id = $1
                 ORDER BY created_at DESC
                 LIMIT 10`,
                [userId]
            ),
            pool.query(
                `SELECT COUNT(*)::int AS count FROM projects WHERE user_id = $1 AND status = 'completed'`,
                [userId]
            ),
            pool.query(
                `SELECT COUNT(*)::int AS count FROM course_enrollments WHERE user_id = $1 AND status = 'completed'`,
                [userId]
            ),
            pool.query(
                `SELECT 
                    e.id,
                    e.course_id,
                    e.progress_percent,
                    e.status,
                    c.title,
                    c.slug,
                    c.thumbnail_url,
                    c.duration_minutes
                 FROM course_enrollments e
                 JOIN courses c ON e.course_id = c.id
                 WHERE e.user_id = $1 AND c.is_published = true
                 ORDER BY e.updated_at DESC
                 LIMIT 5`,
                [userId]
            ),
            pool.query(
                `SELECT status, COUNT(*)::int AS count
                 FROM job_applications
                 WHERE user_id = $1
                 GROUP BY status`,
                [userId]
            ),
            pool.query(
                `SELECT 
                    a.id,
                    a.job_id,
                    a.status,
                    a.applied_at,
                    j.title AS role,
                    j.company_name AS company,
                    j.job_type,
                    j.location
                 FROM job_applications a
                 JOIN jobs j ON a.job_id = j.id
                 WHERE a.user_id = $1
                 ORDER BY a.applied_at DESC
                 LIMIT 5`,
                [userId]
            ),
            pool.query(
                `SELECT 
                    (SELECT COUNT(*)::int FROM freelance_proposals WHERE freelancer_id = $1) AS proposals_count,
                    (SELECT COUNT(*)::int FROM freelance_contracts WHERE (client_id = $1 OR freelancer_id = $1) AND status = 'active') AS active_contracts_count,
                    (SELECT COUNT(*)::int FROM freelance_contracts WHERE (client_id = $1 OR freelancer_id = $1) AND status = 'completed') AS completed_contracts_count,
                    (SELECT COALESCE(SUM(agreed_amount), 0)::numeric FROM freelance_contracts WHERE freelancer_id = $1 AND status = 'completed') AS estimated_earnings`,
                [userId]
            ),
        ]);

        const profile = profileRes.rows[0] || {};
        const skills = skillsRes.rows || [];
        const completedProjectsCount = completedProjectsRes.rows[0]?.count || 0;
        const effectiveProjectsCompleted = Math.max(row.projects_completed || 0, completedProjectsCount);
        const completedCoursesCount = completedCoursesRes.rows[0]?.count || 0;
        const effectiveCoursesCompleted = Math.max(row.courses_completed || 0, completedCoursesCount);

        const recentActivities = activitiesRes.rows.map((act) => ({
            id: act.id,
            userId: act.user_id,
            activityType: act.activity_type,
            activity_type: act.activity_type,
            title: act.title,
            description: act.description,
            xpEarned: act.xp_earned,
            xp_earned: act.xp_earned,
            metadata: act.metadata,
            createdAt: act.created_at,
            created_at: act.created_at,
        }));

        const enrolledCourses = enrolledCoursesRes.rows.map((ec) => ({
            id: ec.id,
            courseId: ec.course_id,
            title: ec.title,
            slug: ec.slug,
            thumbnailUrl: ec.thumbnail_url,
            durationMinutes: ec.duration_minutes,
            progress: ec.progress_percent,
            status: ec.status,
        }));

        const levelData = getLevelProgress(row.total_xp);
        const profileCompleteness = calculateProfileCompleteness(profile, skills);

        const careerProgress = {
            profileComplete: profileCompleteness.percentage === 100,
            skillsCount: skills.length,
            level: levelData.level,
            problemsSolved: row.problems_solved || 0,
            coursesCompleted: effectiveCoursesCompleted,
            projectsCompleted: effectiveProjectsCompleted,
        };

        const statusCounts = {};
        appSummaryRes.rows.forEach((r) => {
            statusCounts[r.status] = r.count;
        });

        const applicationsSummary = {
            total: Object.values(statusCounts).reduce((a, b) => a + b, 0),
            applied: statusCounts["applied"] || 0,
            underReview: statusCounts["under_review"] || 0,
            shortlisted: statusCounts["shortlisted"] || 0,
            interview: statusCounts["interview"] || 0,
            selected: statusCounts["selected"] || 0,
            rejected: statusCounts["rejected"] || 0,
            withdrawn: statusCounts["withdrawn"] || 0,
        };

        const recentApplications = recentAppsRes.rows.map((r) => ({
            id: r.id,
            jobId: r.job_id,
            role: r.role,
            company: r.company,
            status: r.status,
            jobType: r.job_type,
            location: r.location,
            appliedAt: r.applied_at,
        }));

        const fStats = freelanceSummaryRes.rows[0] || {};
        const freelanceSummary = {
            proposalsCount: Number(fStats.proposals_count || 0),
            activeContractsCount: Number(fStats.active_contracts_count || 0),
            completedContractsCount: Number(fStats.completed_contracts_count || 0),
            estimatedEarnings: Number(fStats.estimated_earnings || 0),
            currency: "INR",
        };

        return res.status(200).json({
            success: true,
            dashboard: {
                user: {
                    id: row.id,
                    name: row.name,
                    email: row.email,
                    role: row.role,
                },
                profile,
                progress: {
                    totalXp: row.total_xp,
                    total_xp: row.total_xp,
                    currentStreak: row.current_streak,
                    current_streak: row.current_streak,
                    longestStreak: row.longest_streak,
                    longest_streak: row.longest_streak,
                    problemsSolved: row.problems_solved,
                    problems_solved: row.problems_solved,
                    coursesCompleted: effectiveCoursesCompleted,
                    courses_completed: effectiveCoursesCompleted,
                    projectsCompleted: row.projects_completed,
                    projects_completed: row.projects_completed,
                    level: levelData.level,
                    levelTitle: levelData.levelTitle,
                    levelProgress: levelData.progressPercent,
                    xpForNextLevel: levelData.xpForNextLevel,
                    xpForCurrentLevel: levelData.xpForCurrentLevel,
                    xpIntoLevel: levelData.xpIntoLevel,
                    xpRequiredForNextLevel: levelData.xpRequiredForNextLevel,
                    createdAt: row.progress_created_at,
                    updatedAt: row.progress_updated_at,
                },
                profileCompleteness,
                careerProgress,
                recentActivities,
                enrolledCourses,
                applicationsSummary,
                recentApplications,
                freelanceSummary,
            },
        });
    } catch (error) {
        console.error("Dashboard controller error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve dashboard data",
        });
    }
};
