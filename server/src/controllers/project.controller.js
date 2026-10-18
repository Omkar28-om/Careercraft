import pool from "../db.js";
import { evaluateAchievements } from "../services/achievement.service.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_PROJECT_TYPES = ["academic", "personal", "hackathon", "freelance", "open_source", "other"];
const ALLOWED_STATUSES = ["planned", "in_progress", "completed"];

function isValidHttpUrl(string) {
    if (!string || typeof string !== "string") return false;
    try {
        const url = new URL(string.trim());
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}

function slugify(text) {
    if (!text || typeof text !== "string") return "";
    const base = text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .slice(0, 150);
    return base || "project";
}

function formatProject(row) {
    if (!row) return null;
    return {
        id: row.id,
        userId: row.user_id,
        user_id: row.user_id,
        title: row.title,
        slug: row.slug,
        description: row.description,
        projectType: row.project_type,
        project_type: row.project_type,
        status: row.status,
        technologies: Array.isArray(row.technologies) ? row.technologies : [],
        githubUrl: row.github_url,
        github_url: row.github_url,
        liveUrl: row.live_url,
        live_url: row.live_url,
        imageUrl: row.image_url,
        image_url: row.image_url,
        startDate: row.start_date,
        start_date: row.start_date,
        endDate: row.end_date,
        end_date: row.end_date,
        isFeatured: row.is_featured,
        is_featured: row.is_featured,
        isPublic: row.is_public,
        is_public: row.is_public,
        createdAt: row.created_at,
        created_at: row.created_at,
        updatedAt: row.updated_at,
        updated_at: row.updated_at,
    };
}

/**
 * GET /api/projects
 * Returns all projects belonging to the authenticated user.
 */
export async function getProjects(req, res) {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            `SELECT id, user_id, title, slug, description, project_type, status,
                    technologies, github_url, live_url, image_url, start_date, end_date,
                    is_featured, is_public, created_at, updated_at
             FROM projects
             WHERE user_id = $1
             ORDER BY is_featured DESC, created_at DESC`,
            [userId]
        );

        return res.status(200).json({
            success: true,
            projects: result.rows.map(formatProject),
        });
    } catch (error) {
        console.error("getProjects error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve projects",
        });
    }
}

/**
 * GET /api/projects/:id
 * Returns a specific project belonging to the authenticated user.
 */
export async function getProject(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        if (!id || !UUID_REGEX.test(id)) {
            return res.status(400).json({
                success: false,
                message: "Valid project UUID is required",
            });
        }

        const result = await pool.query(
            `SELECT id, user_id, title, slug, description, project_type, status,
                    technologies, github_url, live_url, image_url, start_date, end_date,
                    is_featured, is_public, created_at, updated_at
             FROM projects
             WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }

        const project = result.rows[0];

        // Strict ownership check
        if (project.user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to access this project",
            });
        }

        return res.status(200).json({
            success: true,
            project: formatProject(project),
        });
    } catch (error) {
        console.error("getProject error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve project",
        });
    }
}

/**
 * GET /api/projects/public/:userId
 * Public endpoint: returns only is_public = true projects for a user.
 */
export async function getPublicProjects(req, res) {
    try {
        const { userId } = req.params;

        if (!userId || !UUID_REGEX.test(userId)) {
            return res.status(400).json({
                success: false,
                message: "Valid user UUID is required",
            });
        }

        const result = await pool.query(
            `SELECT id, user_id, title, slug, description, project_type, status,
                    technologies, github_url, live_url, image_url, start_date, end_date,
                    is_featured, is_public, created_at, updated_at
             FROM projects
             WHERE user_id = $1 AND is_public = true
             ORDER BY is_featured DESC, created_at DESC`,
            [userId]
        );

        return res.status(200).json({
            success: true,
            projects: result.rows.map(formatProject),
        });
    } catch (error) {
        console.error("getPublicProjects error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve public projects",
        });
    }
}

/**
 * POST /api/projects
 * Creates a new project for the authenticated user.
 * Awards +5 XP on creation.
 * If created with status = 'completed', awards +10 XP completion reward.
 */
export async function createProject(req, res) {
    try {
        const userId = req.user.id;
        const {
            title,
            description,
            project_type,
            projectType,
            status,
            technologies,
            github_url,
            githubUrl,
            live_url,
            liveUrl,
            image_url,
            imageUrl,
            start_date,
            startDate,
            end_date,
            endDate,
            is_featured,
            isFeatured,
            is_public,
            isPublic,
        } = req.body;

        // Title validation
        if (!title || typeof title !== "string" || title.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Project title is required",
            });
        }

        const trimmedTitle = title.trim();
        if (trimmedTitle.length > 150) {
            return res.status(400).json({
                success: false,
                message: "Project title must not exceed 150 characters",
            });
        }

        // Description validation
        const trimmedDesc = typeof description === "string" ? description.trim() : null;
        if (trimmedDesc && trimmedDesc.length > 5000) {
            return res.status(400).json({
                success: false,
                message: "Project description must not exceed 5000 characters",
            });
        }

        // Project Type validation
        const rawType = project_type || projectType || "personal";
        const normalizedType = typeof rawType === "string" ? rawType.toLowerCase().trim() : "personal";
        if (!ALLOWED_PROJECT_TYPES.includes(normalizedType)) {
            return res.status(400).json({
                success: false,
                message: `Invalid project type. Allowed: ${ALLOWED_PROJECT_TYPES.join(", ")}`,
            });
        }

        // Status validation
        const rawStatus = status || "in_progress";
        const normalizedStatus = typeof rawStatus === "string" ? rawStatus.toLowerCase().trim() : "in_progress";
        if (!ALLOWED_STATUSES.includes(normalizedStatus)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(", ")}`,
            });
        }

        // Technologies validation
        let techsArray = [];
        if (technologies !== undefined && technologies !== null) {
            if (!Array.isArray(technologies)) {
                return res.status(400).json({
                    success: false,
                    message: "Technologies must be an array of strings",
                });
            }
            if (technologies.length > 30) {
                return res.status(400).json({
                    success: false,
                    message: "Maximum 30 technologies allowed per project",
                });
            }
            for (const item of technologies) {
                if (typeof item !== "string" || item.trim().length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: "Each technology item must be a non-empty string",
                    });
                }
                if (item.trim().length > 50) {
                    return res.status(400).json({
                        success: false,
                        message: "Each technology name must not exceed 50 characters",
                    });
                }
                techsArray.push(item.trim());
            }
        }

        // URLs validation
        const ghUrl = (github_url || githubUrl || "").trim() || null;
        if (ghUrl && !isValidHttpUrl(ghUrl)) {
            return res.status(400).json({
                success: false,
                message: "Invalid GitHub URL format. Must start with http:// or https://",
            });
        }

        const lUrl = (live_url || liveUrl || "").trim() || null;
        if (lUrl && !isValidHttpUrl(lUrl)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Live Demo URL format. Must start with http:// or https://",
            });
        }

        const imgUrl = (image_url || imageUrl || "").trim() || null;
        if (imgUrl && !isValidHttpUrl(imgUrl)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Image URL format. Must start with http:// or https://",
            });
        }

        // Dates
        const sDate = (start_date || startDate || "").trim() || null;
        const eDate = (end_date || endDate || "").trim() || null;

        // Featured flag & limit check (max 3 featured projects)
        const featuredBool = Boolean(is_featured !== undefined ? is_featured : isFeatured);
        if (featuredBool) {
            const featuredCountRes = await pool.query(
                "SELECT COUNT(*)::int AS count FROM projects WHERE user_id = $1 AND is_featured = true",
                [userId]
            );
            const count = featuredCountRes.rows[0]?.count || 0;
            if (count >= 3) {
                return res.status(400).json({
                    success: false,
                    message: "You can have at most 3 featured projects. Please unfeature another project first.",
                });
            }
        }

        const publicBool = is_public !== undefined ? Boolean(is_public) : isPublic !== undefined ? Boolean(isPublic) : true;

        // Generate base slug
        const baseSlug = slugify(trimmedTitle);
        // Ensure unique slug per user
        let finalSlug = baseSlug;
        let suffix = 1;
        while (true) {
            const existingSlugRes = await pool.query(
                "SELECT id FROM projects WHERE user_id = $1 AND slug = $2",
                [userId, finalSlug]
            );
            if (existingSlugRes.rows.length === 0) break;
            finalSlug = `${baseSlug}-${suffix++}`;
        }

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // 1. Insert Project
            const insertRes = await client.query(
                `INSERT INTO projects (
                    user_id, title, slug, description, project_type, status,
                    technologies, github_url, live_url, image_url, start_date, end_date,
                    is_featured, is_public, created_at, updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
                RETURNING *`,
                [
                    userId,
                    trimmedTitle,
                    finalSlug,
                    trimmedDesc,
                    normalizedType,
                    normalizedStatus,
                    JSON.stringify(techsArray),
                    ghUrl,
                    lUrl,
                    imgUrl,
                    sDate,
                    eDate,
                    featuredBool,
                    publicBool,
                ]
            );

            const createdProject = insertRes.rows[0];

            // 2. XP & Activity: +5 XP for project creation
            let totalXpAwarded = 5;
            let completionXp = 0;
            const isCompletedAtCreation = normalizedStatus === "completed";
            if (isCompletedAtCreation) {
                completionXp = 10;
                totalXpAwarded += 10;
            }

            // Ensure student_progress row exists and update XP
            await client.query(
                `INSERT INTO student_progress (
                    user_id, total_xp, current_streak, longest_streak,
                    problems_solved, courses_completed, projects_completed,
                    created_at, updated_at
                )
                VALUES ($1, $2, 0, 0, 0, 0, $3, NOW(), NOW())
                ON CONFLICT (user_id) DO UPDATE SET
                    total_xp = student_progress.total_xp + $2,
                    projects_completed = student_progress.projects_completed + $3,
                    updated_at = NOW()`,
                [userId, totalXpAwarded, isCompletedAtCreation ? 1 : 0]
            );

            // Record creation activity
            await client.query(
                `INSERT INTO user_activity (
                    user_id, activity_type, title, description, xp_earned, metadata, created_at
                )
                VALUES ($1, 'project_created', $2, $3, $4, $5, NOW())`,
                [
                    userId,
                    `Created project ${trimmedTitle}`,
                    `Added "${trimmedTitle}" (${normalizedType}) to portfolio`,
                    5,
                    JSON.stringify({
                        projectId: createdProject.id,
                        title: trimmedTitle,
                        projectType: normalizedType,
                    }),
                ]
            );

            // If created with status = completed, record completion activity as well
            if (isCompletedAtCreation) {
                await client.query(
                    `INSERT INTO user_activity (
                        user_id, activity_type, title, description, xp_earned, metadata, created_at
                    )
                    VALUES ($1, 'project_completed', $2, $3, $4, $5, NOW())`,
                    [
                        userId,
                        `Completed project ${trimmedTitle}`,
                        `Finished development of "${trimmedTitle}"`,
                        10,
                        JSON.stringify({
                            projectId: createdProject.id,
                            title: trimmedTitle,
                        }),
                    ]
                );
            }

            await client.query("COMMIT");

            // Evaluate achievements asynchronously
            try {
                await evaluateAchievements(userId);
            } catch (achErr) {
                console.error("evaluateAchievements error on project creation:", achErr);
            }

            return res.status(201).json({
                success: true,
                message: "Project created successfully",
                project: formatProject(createdProject),
                xpAwarded: totalXpAwarded,
            });
        } catch (dbErr) {
            await client.query("ROLLBACK");
            throw dbErr;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("createProject error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create project",
        });
    }
}

/**
 * PUT /api/projects/:id
 * Updates an existing project belonging to the authenticated user.
 * If status changes to 'completed' for the first time, awards +10 XP.
 * If already completed, does NOT award duplicate completion XP.
 */
export async function updateProject(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        if (!id || !UUID_REGEX.test(id)) {
            return res.status(400).json({
                success: false,
                message: "Valid project UUID is required",
            });
        }

        const existingRes = await pool.query(
            "SELECT * FROM projects WHERE id = $1",
            [id]
        );

        if (existingRes.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }

        const existing = existingRes.rows[0];

        // Ownership enforcement
        if (existing.user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to modify this project",
            });
        }

        const {
            title,
            description,
            project_type,
            projectType,
            status,
            technologies,
            github_url,
            githubUrl,
            live_url,
            liveUrl,
            image_url,
            imageUrl,
            start_date,
            startDate,
            end_date,
            endDate,
            is_featured,
            isFeatured,
            is_public,
            isPublic,
        } = req.body;

        // Title validation
        let updatedTitle = existing.title;
        if (title !== undefined) {
            if (!title || typeof title !== "string" || title.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Project title cannot be empty",
                });
            }
            if (title.trim().length > 150) {
                return res.status(400).json({
                    success: false,
                    message: "Project title must not exceed 150 characters",
                });
            }
            updatedTitle = title.trim();
        }

        // Description
        let updatedDesc = existing.description;
        if (description !== undefined) {
            const trimmed = typeof description === "string" ? description.trim() : null;
            if (trimmed && trimmed.length > 5000) {
                return res.status(400).json({
                    success: false,
                    message: "Project description must not exceed 5000 characters",
                });
            }
            updatedDesc = trimmed;
        }

        // Project Type
        let updatedType = existing.project_type;
        const rawType = project_type !== undefined ? project_type : projectType;
        if (rawType !== undefined) {
            const normalized = typeof rawType === "string" ? rawType.toLowerCase().trim() : "";
            if (!ALLOWED_PROJECT_TYPES.includes(normalized)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid project type. Allowed: ${ALLOWED_PROJECT_TYPES.join(", ")}`,
                });
            }
            updatedType = normalized;
        }

        // Status
        let updatedStatus = existing.status;
        if (status !== undefined) {
            const normalized = typeof status === "string" ? status.toLowerCase().trim() : "";
            if (!ALLOWED_STATUSES.includes(normalized)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(", ")}`,
                });
            }
            updatedStatus = normalized;
        }

        // Technologies
        let updatedTechs = Array.isArray(existing.technologies) ? existing.technologies : [];
        if (technologies !== undefined) {
            if (!Array.isArray(technologies)) {
                return res.status(400).json({
                    success: false,
                    message: "Technologies must be an array of strings",
                });
            }
            if (technologies.length > 30) {
                return res.status(400).json({
                    success: false,
                    message: "Maximum 30 technologies allowed per project",
                });
            }
            updatedTechs = [];
            for (const item of technologies) {
                if (typeof item !== "string" || item.trim().length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: "Each technology item must be a non-empty string",
                    });
                }
                if (item.trim().length > 50) {
                    return res.status(400).json({
                        success: false,
                        message: "Each technology name must not exceed 50 characters",
                    });
                }
                updatedTechs.push(item.trim());
            }
        }

        // URLs
        let updatedGh = existing.github_url;
        const rawGh = github_url !== undefined ? github_url : githubUrl;
        if (rawGh !== undefined) {
            const trimmed = (rawGh || "").trim() || null;
            if (trimmed && !isValidHttpUrl(trimmed)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid GitHub URL format. Must start with http:// or https://",
                });
            }
            updatedGh = trimmed;
        }

        let updatedLive = existing.live_url;
        const rawLive = live_url !== undefined ? live_url : liveUrl;
        if (rawLive !== undefined) {
            const trimmed = (rawLive || "").trim() || null;
            if (trimmed && !isValidHttpUrl(trimmed)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid Live Demo URL format. Must start with http:// or https://",
                });
            }
            updatedLive = trimmed;
        }

        let updatedImg = existing.image_url;
        const rawImg = image_url !== undefined ? image_url : imageUrl;
        if (rawImg !== undefined) {
            const trimmed = (rawImg || "").trim() || null;
            if (trimmed && !isValidHttpUrl(trimmed)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid Image URL format. Must start with http:// or https://",
                });
            }
            updatedImg = trimmed;
        }

        // Dates
        let updatedStart = existing.start_date;
        const rawStart = start_date !== undefined ? start_date : startDate;
        if (rawStart !== undefined) {
            updatedStart = (rawStart || "").trim() || null;
        }

        let updatedEnd = existing.end_date;
        const rawEnd = end_date !== undefined ? end_date : endDate;
        if (rawEnd !== undefined) {
            updatedEnd = (rawEnd || "").trim() || null;
        }

        // Featured limit check
        let updatedFeatured = existing.is_featured;
        const rawFeatured = is_featured !== undefined ? is_featured : isFeatured;
        if (rawFeatured !== undefined) {
            const willBeFeatured = Boolean(rawFeatured);
            if (willBeFeatured && !existing.is_featured) {
                // Switching from non-featured to featured: verify user doesn't already have 3
                const countRes = await pool.query(
                    "SELECT COUNT(*)::int AS count FROM projects WHERE user_id = $1 AND is_featured = true AND id != $2",
                    [userId, id]
                );
                const count = countRes.rows[0]?.count || 0;
                if (count >= 3) {
                    return res.status(400).json({
                        success: false,
                        message: "You can have at most 3 featured projects. Please unfeature another project first.",
                    });
                }
            }
            updatedFeatured = willBeFeatured;
        }

        let updatedPublic = existing.is_public;
        const rawPublic = is_public !== undefined ? is_public : isPublic;
        if (rawPublic !== undefined) {
            updatedPublic = Boolean(rawPublic);
        }

        // Slug update if title changed
        let updatedSlug = existing.slug;
        if (title !== undefined && updatedTitle !== existing.title) {
            const baseSlug = slugify(updatedTitle);
            updatedSlug = baseSlug;
            let suffix = 1;
            while (true) {
                const existingSlugRes = await pool.query(
                    "SELECT id FROM projects WHERE user_id = $1 AND slug = $2 AND id != $3",
                    [userId, updatedSlug, id]
                );
                if (existingSlugRes.rows.length === 0) break;
                updatedSlug = `${baseSlug}-${suffix++}`;
            }
        }

        // Check if project is transitioning to completed for the FIRST time
        const wasCompleted = existing.status === "completed";
        const isNowCompleted = updatedStatus === "completed";
        const isTransitioningToCompleted = !wasCompleted && isNowCompleted;

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            const updateRes = await client.query(
                `UPDATE projects
                 SET title = $1,
                     slug = $2,
                     description = $3,
                     project_type = $4,
                     status = $5,
                     technologies = $6,
                     github_url = $7,
                     live_url = $8,
                     image_url = $9,
                     start_date = $10,
                     end_date = $11,
                     is_featured = $12,
                     is_public = $13,
                     updated_at = NOW()
                 WHERE id = $14
                 RETURNING *`,
                [
                    updatedTitle,
                    updatedSlug,
                    updatedDesc,
                    updatedType,
                    updatedStatus,
                    JSON.stringify(updatedTechs),
                    updatedGh,
                    updatedLive,
                    updatedImg,
                    updatedStart,
                    updatedEnd,
                    updatedFeatured,
                    updatedPublic,
                    id,
                ]
            );

            const updatedProject = updateRes.rows[0];

            let completionXpAwarded = 0;
            // Award completion XP only if transitioning to completed
            if (isTransitioningToCompleted) {
                completionXpAwarded = 10;

                await client.query(
                    `INSERT INTO student_progress (
                        user_id, total_xp, current_streak, longest_streak,
                        problems_solved, courses_completed, projects_completed,
                        created_at, updated_at
                    )
                    VALUES ($1, 10, 0, 0, 0, 0, 1, NOW(), NOW())
                    ON CONFLICT (user_id) DO UPDATE SET
                        total_xp = student_progress.total_xp + 10,
                        projects_completed = student_progress.projects_completed + 1,
                        updated_at = NOW()`,
                    [userId]
                );

                await client.query(
                    `INSERT INTO user_activity (
                        user_id, activity_type, title, description, xp_earned, metadata, created_at
                    )
                    VALUES ($1, 'project_completed', $2, $3, 10, $4, NOW())`,
                    [
                        userId,
                        `Completed project ${updatedTitle}`,
                        `Finished development of "${updatedTitle}"`,
                        JSON.stringify({
                            projectId: id,
                            title: updatedTitle,
                        }),
                    ]
                );
            }

            await client.query("COMMIT");

            if (isTransitioningToCompleted) {
                try {
                    await evaluateAchievements(userId);
                } catch (achErr) {
                    console.error("evaluateAchievements error on project completion:", achErr);
                }
            }

            return res.status(200).json({
                success: true,
                message: "Project updated successfully",
                project: formatProject(updatedProject),
                completionXpAwarded,
            });
        } catch (dbErr) {
            await client.query("ROLLBACK");
            throw dbErr;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("updateProject error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update project",
        });
    }
}

/**
 * DELETE /api/projects/:id
 * Deletes a project belonging to the authenticated user.
 * Does NOT deduct XP.
 */
export async function deleteProject(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        if (!id || !UUID_REGEX.test(id)) {
            return res.status(400).json({
                success: false,
                message: "Valid project UUID is required",
            });
        }

        const projectRes = await pool.query(
            "SELECT id, user_id, title FROM projects WHERE id = $1",
            [id]
        );

        if (projectRes.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }

        const project = projectRes.rows[0];

        // Ownership enforcement
        if (project.user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to delete this project",
            });
        }

        await pool.query("DELETE FROM projects WHERE id = $1", [id]);

        return res.status(200).json({
            success: true,
            message: "Project deleted successfully",
        });
    } catch (error) {
        console.error("deleteProject error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete project",
        });
    }
}
