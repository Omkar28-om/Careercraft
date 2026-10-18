import pool from "../db.js";
import { evaluateAchievements } from "../services/achievement.service.js";
import { createNotification } from "../services/notification.service.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidHttpUrl(string) {
    if (!string || typeof string !== "string") return false;
    try {
        const url = new URL(string.trim());
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}

function formatJob(row) {
    if (!row) return null;
    return {
        id: row.id,
        title: row.title,
        companyName: row.company_name || row.companyName,
        companyLogoUrl: row.company_logo_url || row.companyLogoUrl,
        description: row.description,
        jobType: row.job_type || row.jobType,
        employmentType: row.employment_type || row.employmentType,
        location: row.location,
        workMode: row.work_mode || row.workMode,
        salaryMin: row.salary_min !== null ? Number(row.salary_min) : null,
        salaryMax: row.salary_max !== null ? Number(row.salary_max) : null,
        salaryCurrency: row.salary_currency || "INR",
        skills: Array.isArray(row.skills) ? row.skills : [],
        requirements: Array.isArray(row.requirements) ? row.requirements : [],
        responsibilities: Array.isArray(row.responsibilities) ? row.responsibilities : [],
        eligibility: row.eligibility,
        applicationUrl: row.application_url,
        applicationDeadline: row.application_deadline,
        category: row.category,
        experienceLevel: row.experience_level || row.experienceLevel,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        // Optional user context fields
        isSaved: row.is_saved !== undefined ? Boolean(row.is_saved) : undefined,
        hasApplied: row.has_applied !== undefined ? Boolean(row.has_applied) : undefined,
        applicationStatus: row.application_status || undefined,
    };
}

/**
 * GET /api/jobs
 * Public catalog of active opportunities with parameterized search and filters.
 */
export async function getJobs(req, res) {
    try {
        const { search, jobType, type, category, location, workMode, experienceLevel } = req.query;
        const currentUserId = req.user?.id || null;

        const conditions = ["j.is_active = true"];
        const params = [];

        if (search && search.trim()) {
            params.push(`%${search.trim().toLowerCase()}%`);
            conditions.push(`(LOWER(j.title) LIKE $${params.length} OR LOWER(j.company_name) LIKE $${params.length} OR LOWER(j.description) LIKE $${params.length})`);
        }

        const resolvedType = (jobType || type || "").trim().toLowerCase();
        if (resolvedType && resolvedType !== "all") {
            params.push(resolvedType);
            conditions.push(`j.job_type = $${params.length}`);
        }

        if (category && category.trim() && category.trim().toLowerCase() !== "all") {
            params.push(category.trim());
            conditions.push(`j.category = $${params.length}`);
        }

        if (location && location.trim() && location.trim().toLowerCase() !== "all") {
            params.push(`%${location.trim().toLowerCase()}%`);
            conditions.push(`LOWER(j.location) LIKE $${params.length}`);
        }

        if (workMode && workMode.trim() && workMode.trim().toLowerCase() !== "all") {
            params.push(workMode.trim().toLowerCase());
            conditions.push(`j.work_mode = $${params.length}`);
        }

        if (experienceLevel && experienceLevel.trim() && experienceLevel.trim().toLowerCase() !== "all") {
            params.push(experienceLevel.trim().toLowerCase());
            conditions.push(`j.experience_level = $${params.length}`);
        }

        let joins = "";
        let extraSelects = "";

        if (currentUserId) {
            params.push(currentUserId);
            const userIdx = params.length;
            joins = `
                LEFT JOIN saved_jobs sj ON j.id = sj.job_id AND sj.user_id = $${userIdx}
                LEFT JOIN job_applications ja ON j.id = ja.job_id AND ja.user_id = $${userIdx}
            `;
            extraSelects = `, (sj.job_id IS NOT NULL) AS is_saved, (ja.id IS NOT NULL) AS has_applied, ja.status AS application_status`;
        }

        const query = `
            SELECT 
                j.id, j.title, j.company_name, j.company_logo_url, j.description,
                j.job_type, j.employment_type, j.location, j.work_mode,
                j.salary_min, j.salary_max, j.salary_currency, j.skills,
                j.requirements, j.responsibilities, j.eligibility, j.application_url,
                j.application_deadline, j.category, j.experience_level, j.is_active,
                j.created_at, j.updated_at
                ${extraSelects}
            FROM jobs j
            ${joins}
            WHERE ${conditions.join(" AND ")}
            ORDER BY j.created_at DESC
        `;

        const result = await pool.query(query, params);

        return res.status(200).json({
            success: true,
            jobs: result.rows.map(formatJob),
        });
    } catch (error) {
        console.error("getJobs error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch jobs",
        });
    }
}

/**
 * GET /api/jobs/:id
 * Full job details.
 */
export async function getJob(req, res) {
    try {
        const { id } = req.params;
        const currentUserId = req.user?.id || null;

        if (!id || !UUID_REGEX.test(id)) {
            return res.status(400).json({
                success: false,
                message: "Valid job UUID is required",
            });
        }

        const jobRes = await pool.query(
            `SELECT * FROM jobs WHERE id = $1 AND is_active = true`,
            [id]
        );

        if (jobRes.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Job not found or inactive",
            });
        }

        const job = jobRes.rows[0];

        let isSaved = false;
        let hasApplied = false;
        let applicationStatus = null;

        if (currentUserId) {
            const [savedRes, appRes] = await Promise.all([
                pool.query("SELECT 1 FROM saved_jobs WHERE user_id = $1 AND job_id = $2", [currentUserId, id]),
                pool.query("SELECT status FROM job_applications WHERE user_id = $1 AND job_id = $2", [currentUserId, id]),
            ]);
            isSaved = savedRes.rows.length > 0;
            if (appRes.rows.length > 0) {
                hasApplied = true;
                applicationStatus = appRes.rows[0].status;
            }
        }

        return res.status(200).json({
            success: true,
            job: {
                ...formatJob(job),
                isSaved,
                hasApplied,
                applicationStatus,
            },
        });
    } catch (error) {
        console.error("getJob error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch job details",
        });
    }
}

/**
 * POST /api/jobs/:jobId/apply
 * Authenticated student application with +5 XP award.
 */
export async function applyToJob(req, res) {
    const client = await pool.connect();
    try {
        const userId = req.user.id;
        const { jobId } = req.params;
        const { cover_note, coverNote, resume_url, resumeUrl } = req.body || {};

        if (!jobId || !UUID_REGEX.test(jobId)) {
            return res.status(400).json({
                success: false,
                message: "Valid job UUID is required",
            });
        }

        // 1. Verify job exists and is active
        const jobRes = await client.query(
            "SELECT id, title, company_name, is_active, application_deadline FROM jobs WHERE id = $1",
            [jobId]
        );

        if (jobRes.rows.length === 0 || !jobRes.rows[0].is_active) {
            return res.status(400).json({
                success: false,
                message: "This job opportunity is not active or does not exist",
            });
        }

        const job = jobRes.rows[0];

        // 2. Verify application deadline has not passed
        if (job.application_deadline) {
            const deadline = new Date(job.application_deadline);
            const now = new Date();
            // Reset hours for fair date comparison
            now.setHours(0, 0, 0, 0);
            if (deadline < now) {
                return res.status(400).json({
                    success: false,
                    message: "Applications for this position have closed",
                });
            }
        }

        // 3. Verify user has not already applied
        const existingAppRes = await client.query(
            "SELECT id, status FROM job_applications WHERE user_id = $1 AND job_id = $2",
            [userId, jobId]
        );
        if (existingAppRes.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: "You have already applied to this position",
            });
        }

        // 4. Validate cover note and resume URL
        const trimmedCover = (cover_note || coverNote || "").trim();
        if (trimmedCover.length > 3000) {
            return res.status(400).json({
                success: false,
                message: "Cover note cannot exceed 3000 characters",
            });
        }

        const trimmedResume = (resume_url || resumeUrl || "").trim() || null;
        if (trimmedResume && !isValidHttpUrl(trimmedResume)) {
            return res.status(400).json({
                success: false,
                message: "Resume URL must be a valid URL starting with http:// or https://",
            });
        }

        await client.query("BEGIN");

        // 5. Insert application
        const insertRes = await client.query(
            `INSERT INTO job_applications (
                user_id, job_id, status, cover_note, resume_url, applied_at, updated_at
            )
            VALUES ($1, $2, 'applied', $3, $4, NOW(), NOW())
            RETURNING id, user_id, job_id, status, cover_note, resume_url, applied_at, updated_at`,
            [userId, jobId, trimmedCover || null, trimmedResume]
        );

        const application = insertRes.rows[0];

        // 6. Award +5 XP for job application
        await client.query(
            `INSERT INTO student_progress (
                user_id, total_xp, current_streak, longest_streak,
                problems_solved, courses_completed, projects_completed,
                created_at, updated_at
            )
            VALUES ($1, 5, 0, 0, 0, 0, 0, NOW(), NOW())
            ON CONFLICT (user_id) DO UPDATE SET
                total_xp = student_progress.total_xp + 5,
                updated_at = NOW()`,
            [userId]
        );

        // 7. Record user activity
        await client.query(
            `INSERT INTO user_activity (
                user_id, activity_type, title, description, xp_earned, metadata, created_at
            )
            VALUES ($1, 'job_applied', $2, $3, $4, $5, NOW())`,
            [
                userId,
                `Applied to ${job.title}`,
                `Submitted application to ${job.company_name} for "${job.title}"`,
                5,
                JSON.stringify({
                    jobId: job.id,
                    applicationId: application.id,
                    jobTitle: job.title,
                    companyName: job.company_name,
                }),
            ]
        );

        // 8. Create application submitted notification inside transaction
        await createNotification({
            client,
            userId,
            type: "job_application",
            title: "Application submitted",
            message: `Your application for ${job.title} has been submitted.`,
            link: `/applications/${application.id}`,
            metadata: {
                jobId: job.id,
                applicationId: application.id,
                jobTitle: job.title,
            },
            eventKey: `job_application:${application.id}`,
        });

        await client.query("COMMIT");

        // 8. Trigger achievements evaluation outside transaction
        evaluateAchievements(userId).catch((err) =>
            console.error("evaluateAchievements error in applyToJob:", err)
        );

        return res.status(201).json({
            success: true,
            message: "Application submitted successfully! (+5 XP)",
            application: {
                id: application.id,
                userId: application.user_id,
                jobId: application.job_id,
                status: application.status,
                coverNote: application.cover_note,
                resumeUrl: application.resume_url,
                appliedAt: application.applied_at,
            },
            awardedXp: 5,
        });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("applyToJob error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to submit application",
        });
    } finally {
        client.release();
    }
}

/**
 * GET /api/jobs/applications
 * Returns authenticated user's submitted applications.
 */
export async function getApplications(req, res) {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            `SELECT 
                a.id, a.job_id, a.status, a.cover_note, a.resume_url, a.applied_at, a.updated_at,
                j.title, j.company_name, j.company_logo_url, j.location, j.work_mode,
                j.job_type, j.employment_type, j.category
             FROM job_applications a
             JOIN jobs j ON a.job_id = j.id
             WHERE a.user_id = $1
             ORDER BY a.applied_at DESC`,
            [userId]
        );

        const applications = result.rows.map((r) => ({
            id: r.id,
            jobId: r.job_id,
            status: r.status,
            coverNote: r.cover_note,
            resumeUrl: r.resume_url,
            appliedAt: r.applied_at,
            updatedAt: r.updated_at,
            jobTitle: r.title,
            companyName: r.company_name,
            companyLogoUrl: r.company_logo_url,
            location: r.location,
            workMode: r.work_mode,
            jobType: r.job_type,
            employmentType: r.employment_type,
            category: r.category,
        }));

        return res.status(200).json({
            success: true,
            applications,
        });
    } catch (error) {
        console.error("getApplications error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch applications",
        });
    }
}

/**
 * GET /api/jobs/applications/:id
 * Single application detail for owner.
 */
export async function getApplication(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        if (!id || !UUID_REGEX.test(id)) {
            return res.status(400).json({
                success: false,
                message: "Valid application UUID is required",
            });
        }

        const result = await pool.query(
            `SELECT 
                a.id, a.user_id, a.job_id, a.status, a.cover_note, a.resume_url,
                a.applied_at, a.updated_at,
                j.title, j.company_name, j.company_logo_url, j.location, j.work_mode,
                j.job_type, j.employment_type, j.description, j.eligibility
             FROM job_applications a
             JOIN jobs j ON a.job_id = j.id
             WHERE a.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Application not found",
            });
        }

        const app = result.rows[0];

        // Ownership verification
        if (app.user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: "Access denied to this application",
            });
        }

        return res.status(200).json({
            success: true,
            application: {
                id: app.id,
                jobId: app.job_id,
                status: app.status,
                coverNote: app.cover_note,
                resumeUrl: app.resume_url,
                appliedAt: app.applied_at,
                updatedAt: app.updated_at,
                job: {
                    title: app.title,
                    companyName: app.company_name,
                    companyLogoUrl: app.company_logo_url,
                    location: app.location,
                    workMode: app.work_mode,
                    jobType: app.job_type,
                    employmentType: app.employment_type,
                    description: app.description,
                    eligibility: app.eligibility,
                },
            },
        });
    } catch (error) {
        console.error("getApplication error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch application",
        });
    }
}

/**
 * PATCH /api/jobs/applications/:id/status
 * Student withdrawal endpoint.
 * Restricted strictly to safe student action: 'withdrawn'
 * Only allowed when status is 'applied' or 'under_review'.
 */
export async function updateApplicationStatus(req, res) {
    try {
        const userId = req.user.id;
        const isAdmin = req.user.role === "admin";
        const { id } = req.params;
        const { status } = req.body || {};

        if (!id || !UUID_REGEX.test(id)) {
            return res.status(400).json({
                success: false,
                message: "Valid application UUID is required",
            });
        }

        const validStatuses = ["applied", "under_review", "shortlisted", "interview", "selected", "rejected", "withdrawn"];
        if (!status || typeof status !== "string" || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid application status",
            });
        }

        // Students can ONLY withdraw their application.
        // They cannot mark themselves selected, shortlisted, or interview.
        if (!isAdmin && status !== "withdrawn") {
            return res.status(403).json({
                success: false,
                message: "Students are only permitted to withdraw their application",
            });
        }

        const appRes = await pool.query(
            `SELECT ja.id, ja.user_id, ja.status, ja.job_id, j.title AS job_title
             FROM job_applications ja
             JOIN jobs j ON ja.job_id = j.id
             WHERE ja.id = $1`,
            [id]
        );

        if (appRes.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Application not found",
            });
        }

        const app = appRes.rows[0];

        // Ownership check for non-admin
        if (!isAdmin && app.user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: "Access denied to this application",
            });
        }

        // Can only withdraw if in applied or under_review
        if (!isAdmin && status === "withdrawn" && app.status !== "applied" && app.status !== "under_review") {
            return res.status(400).json({
                success: false,
                message: `Applications in status '${app.status}' cannot be withdrawn`,
            });
        }

        if (app.status !== status) {
            await pool.query(
                "UPDATE job_applications SET status = $1, updated_at = NOW() WHERE id = $2",
                [status, id]
            );

            // Create notification for student
            const statusMessages = {
                under_review: `Your application for ${app.job_title} is now under review.`,
                shortlisted: `You have been shortlisted for ${app.job_title}.`,
                interview: `Your application for ${app.job_title} has moved to the interview stage.`,
                selected: `Your application for ${app.job_title} has been marked selected.`,
                rejected: `Your application for ${app.job_title} has been rejected.`,
                withdrawn: `Your application for ${app.job_title} has been withdrawn.`,
            };

            const statusTitles = {
                under_review: "Application under review",
                shortlisted: "Application shortlisted",
                interview: "Interview scheduled",
                selected: "Application selected",
                rejected: "Application rejected",
                withdrawn: "Application withdrawn",
            };

            if (statusMessages[status]) {
                await createNotification({
                    userId: app.user_id,
                    type: "job_status_update",
                    title: statusTitles[status] || "Application status update",
                    message: statusMessages[status],
                    link: `/applications/${app.id}`,
                    metadata: {
                        applicationId: app.id,
                        jobId: app.job_id,
                        jobTitle: app.job_title,
                        status,
                    },
                    eventKey: `job_status_update:${app.id}:${status}`,
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: status === "withdrawn" ? "Application successfully withdrawn" : `Application status updated to ${status}`,
            status,
            application: {
                id,
                status,
            },
        });
    } catch (error) {
        console.error("updateApplicationStatus error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update application status",
        });
    }
}

/**
 * POST /api/jobs/:jobId/save
 * Idempotent save job bookmark.
 */
export async function saveJob(req, res) {
    try {
        const userId = req.user.id;
        const { jobId } = req.params;

        if (!jobId || !UUID_REGEX.test(jobId)) {
            return res.status(400).json({
                success: false,
                message: "Valid job UUID is required",
            });
        }

        // Verify job exists
        const jobRes = await pool.query("SELECT id FROM jobs WHERE id = $1", [jobId]);
        if (jobRes.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Job not found",
            });
        }

        await pool.query(
            `INSERT INTO saved_jobs (user_id, job_id, saved_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (user_id, job_id) DO NOTHING`,
            [userId, jobId]
        );

        return res.status(200).json({
            success: true,
            isSaved: true,
            message: "Job saved successfully",
        });
    } catch (error) {
        console.error("saveJob error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to save job",
        });
    }
}

/**
 * DELETE /api/jobs/:jobId/save
 * Remove job from saved list.
 */
export async function unsaveJob(req, res) {
    try {
        const userId = req.user.id;
        const { jobId } = req.params;

        if (!jobId || !UUID_REGEX.test(jobId)) {
            return res.status(400).json({
                success: false,
                message: "Valid job UUID is required",
            });
        }

        await pool.query(
            "DELETE FROM saved_jobs WHERE user_id = $1 AND job_id = $2",
            [userId, jobId]
        );

        return res.status(200).json({
            success: true,
            isSaved: false,
            message: "Job removed from saved list",
        });
    } catch (error) {
        console.error("unsaveJob error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to unsave job",
        });
    }
}

/**
 * GET /api/jobs/saved
 * Return all saved jobs for current user.
 */
export async function getSavedJobs(req, res) {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            `SELECT 
                s.saved_at,
                j.id, j.title, j.company_name, j.company_logo_url, j.location,
                j.work_mode, j.job_type, j.employment_type, j.experience_level,
                j.salary_min, j.salary_max, j.salary_currency, j.skills,
                j.application_deadline, j.category
             FROM saved_jobs s
             JOIN jobs j ON s.job_id = j.id
             WHERE s.user_id = $1 AND j.is_active = true
             ORDER BY s.saved_at DESC`,
            [userId]
        );

        const savedJobs = result.rows.map((r) => ({
            jobId: r.id,
            savedAt: r.saved_at,
            job: {
                id: r.id,
                title: r.title,
                companyName: r.company_name,
                companyLogoUrl: r.company_logo_url,
                location: r.location,
                workMode: r.work_mode,
                jobType: r.job_type,
                employmentType: r.employment_type,
                experienceLevel: r.experience_level,
                salaryMin: r.salary_min !== null ? Number(r.salary_min) : null,
                salaryMax: r.salary_max !== null ? Number(r.salary_max) : null,
                salaryCurrency: r.salary_currency || "INR",
                skills: Array.isArray(r.skills) ? r.skills : [],
                applicationDeadline: r.application_deadline,
                category: r.category,
            },
        }));

        return res.status(200).json({
            success: true,
            savedJobs,
        });
    } catch (error) {
        console.error("getSavedJobs error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch saved jobs",
        });
    }
}
