import pool from "../db.js";
import { evaluateAchievements } from "../services/achievement.service.js";
import { createNotification } from "../services/notification.service.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function formatProject(row) {
    if (!row) return null;
    return {
        id: row.id,
        clientId: row.client_id,
        title: row.title,
        description: row.description,
        category: row.category,
        skills: Array.isArray(row.skills) ? row.skills : [],
        budgetType: row.budget_type,
        budgetMin: row.budget_min !== null ? Number(row.budget_min) : null,
        budgetMax: row.budget_max !== null ? Number(row.budget_max) : null,
        currency: row.currency || "INR",
        durationDays: row.duration_days,
        experienceLevel: row.experience_level,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        proposalCount: row.proposal_count !== undefined ? Number(row.proposal_count) : 0,
        client: {
            id: row.client_id,
            name: row.client_name || "Client",
            college: row.client_college || null,
            avatarUrl: row.client_avatar_url || null,
        },
        isSaved: row.is_saved !== undefined ? Boolean(row.is_saved) : undefined,
        hasProposed: row.has_proposed !== undefined ? Boolean(row.has_proposed) : undefined,
        userProposalStatus: row.user_proposal_status || undefined,
    };
}

/**
 * GET /api/freelance/projects
 * Public & authenticated catalog with search, filtering, and pagination.
 */
export async function getProjects(req, res) {
    try {
        const {
            search,
            category,
            budgetType,
            experienceLevel,
            status,
            skill,
            page = 1,
            limit = 10,
        } = req.query;

        const currentUserId = req.user?.id || null;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
        const offset = (pageNum - 1) * limitNum;

        const conditions = [];
        const params = [];

        // Default to 'open' status unless explicitly requested otherwise
        const resolvedStatus = (status || "open").trim().toLowerCase();
        if (resolvedStatus && resolvedStatus !== "all") {
            params.push(resolvedStatus);
            conditions.push(`p.status = $${params.length}`);
        }

        if (search && search.trim()) {
            params.push(`%${search.trim().toLowerCase()}%`);
            conditions.push(`(LOWER(p.title) LIKE $${params.length} OR LOWER(p.description) LIKE $${params.length} OR LOWER(u.name) LIKE $${params.length})`);
        }

        if (category && category.trim() && category.trim().toLowerCase() !== "all") {
            params.push(category.trim());
            conditions.push(`p.category = $${params.length}`);
        }

        if (budgetType && budgetType.trim() && budgetType.trim().toLowerCase() !== "all") {
            params.push(budgetType.trim().toLowerCase());
            conditions.push(`p.budget_type = $${params.length}`);
        }

        if (experienceLevel && experienceLevel.trim() && experienceLevel.trim().toLowerCase() !== "all") {
            params.push(experienceLevel.trim().toLowerCase());
            conditions.push(`p.experience_level = $${params.length}`);
        }

        if (skill && skill.trim()) {
            params.push(JSON.stringify([skill.trim()]));
            conditions.push(`p.skills @> $${params.length}::jsonb`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        // Total count query
        const countQuery = `
            SELECT COUNT(*)::int AS total
            FROM freelance_projects p
            JOIN users u ON p.client_id = u.id
            ${whereClause}
        `;
        const countRes = await pool.query(countQuery, params);
        const total = countRes.rows[0]?.total || 0;

        // Data query with client info, proposal count, and user saved/proposed status
        let joins = "";
        let extraSelects = "";

        if (currentUserId) {
            params.push(currentUserId);
            const userIdx = params.length;
            joins = `
                LEFT JOIN freelance_saved_projects sp ON p.id = sp.project_id AND sp.freelancer_id = $${userIdx}
                LEFT JOIN freelance_proposals fp_user ON p.id = fp_user.project_id AND fp_user.freelancer_id = $${userIdx}
            `;
            extraSelects = `, (sp.project_id IS NOT NULL) AS is_saved, (fp_user.id IS NOT NULL) AS has_proposed, fp_user.status AS user_proposal_status`;
        }

        params.push(limitNum);
        const limitIdx = params.length;
        params.push(offset);
        const offsetIdx = params.length;

        const dataQuery = `
            SELECT 
                p.id, p.client_id, p.title, p.description, p.category, p.skills,
                p.budget_type, p.budget_min, p.budget_max, p.currency, p.duration_days,
                p.experience_level, p.status, p.created_at, p.updated_at,
                u.name AS client_name, prof.college AS client_college, prof.avatar_url AS client_avatar_url,
                (SELECT COUNT(*)::int FROM freelance_proposals fp WHERE fp.project_id = p.id) AS proposal_count
                ${extraSelects}
            FROM freelance_projects p
            JOIN users u ON p.client_id = u.id
            LEFT JOIN profiles prof ON u.id = prof.id
            ${joins}
            ${whereClause}
            ORDER BY p.created_at DESC
            LIMIT $${limitIdx} OFFSET $${offsetIdx}
        `;

        const dataRes = await pool.query(dataQuery, params);
        const projects = dataRes.rows.map(formatProject);

        return res.status(200).json({
            success: true,
            projects,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum) || 1,
            },
        });
    } catch (error) {
        console.error("getProjects error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch freelance projects",
        });
    }
}

/**
 * GET /api/freelance/projects/:id
 * Single project detail.
 */
export async function getProject(req, res) {
    try {
        const { id } = req.params;
        const currentUserId = req.user?.id || null;

        if (!id || !UUID_REGEX.test(id)) {
            return res.status(400).json({
                success: false,
                message: "Valid project UUID is required",
            });
        }

        let userJoin = "";
        let userSelect = "";
        const queryParams = [id];

        if (currentUserId) {
            queryParams.push(currentUserId);
            userJoin = `
                LEFT JOIN freelance_saved_projects sp ON p.id = sp.project_id AND sp.freelancer_id = $2
                LEFT JOIN freelance_proposals fp_user ON p.id = fp_user.project_id AND fp_user.freelancer_id = $2
            `;
            userSelect = `, (sp.project_id IS NOT NULL) AS is_saved, (fp_user.id IS NOT NULL) AS has_proposed, fp_user.status AS user_proposal_status, fp_user.id AS user_proposal_id`;
        }

        const query = `
            SELECT 
                p.id, p.client_id, p.title, p.description, p.category, p.skills,
                p.budget_type, p.budget_min, p.budget_max, p.currency, p.duration_days,
                p.experience_level, p.status, p.created_at, p.updated_at,
                u.name AS client_name, prof.college AS client_college, prof.avatar_url AS client_avatar_url,
                (SELECT COUNT(*)::int FROM freelance_proposals fp WHERE fp.project_id = p.id) AS proposal_count
                ${userSelect}
            FROM freelance_projects p
            JOIN users u ON p.client_id = u.id
            LEFT JOIN profiles prof ON u.id = prof.id
            ${userJoin}
            WHERE p.id = $1
        `;

        const result = await pool.query(query, queryParams);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Freelance project not found",
            });
        }

        const row = result.rows[0];
        const project = formatProject(row);
        const isOwner = Boolean(currentUserId && row.client_id === currentUserId);

        return res.status(200).json({
            success: true,
            project: {
                ...project,
                isOwner,
                userProposalId: row.user_proposal_id || undefined,
            },
        });
    } catch (error) {
        console.error("getProject error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch freelance project",
        });
    }
}

/**
 * POST /api/freelance/projects
 * Create a new freelance project. Authenticated client.
 */
export async function createProject(req, res) {
    try {
        const clientId = req.user.id;
        const {
            title,
            description,
            category,
            skills,
            budgetType,
            budget_type,
            budgetMin,
            budget_min,
            budgetMax,
            budget_max,
            currency = "INR",
            durationDays,
            duration_days,
            experienceLevel,
            experience_level,
        } = req.body || {};

        if (!title || typeof title !== "string" || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: "Project title is required",
            });
        }
        if (title.trim().length > 180) {
            return res.status(400).json({
                success: false,
                message: "Title cannot exceed 180 characters",
            });
        }

        if (!description || typeof description !== "string" || !description.trim()) {
            return res.status(400).json({
                success: false,
                message: "Project description is required",
            });
        }

        if (!category || typeof category !== "string" || !category.trim()) {
            return res.status(400).json({
                success: false,
                message: "Project category is required",
            });
        }

        const resolvedBudgetType = (budgetType || budget_type || "fixed").trim().toLowerCase();
        if (!["fixed", "hourly"].includes(resolvedBudgetType)) {
            return res.status(400).json({
                success: false,
                message: "Budget type must be 'fixed' or 'hourly'",
            });
        }

        const rawMin = budgetMin !== undefined ? budgetMin : budget_min;
        const rawMax = budgetMax !== undefined ? budgetMax : budget_max;
        const bMin = rawMin !== undefined && rawMin !== null && rawMin !== "" ? Number(rawMin) : null;
        const bMax = rawMax !== undefined && rawMax !== null && rawMax !== "" ? Number(rawMax) : null;

        if (bMin !== null && (isNaN(bMin) || bMin < 0)) {
            return res.status(400).json({
                success: false,
                message: "Minimum budget must be a positive number",
            });
        }
        if (bMax !== null && (isNaN(bMax) || bMax < 0)) {
            return res.status(400).json({
                success: false,
                message: "Maximum budget must be a positive number",
            });
        }
        if (bMin !== null && bMax !== null && bMin > bMax) {
            return res.status(400).json({
                success: false,
                message: "Minimum budget cannot exceed maximum budget",
            });
        }

        const rawDuration = durationDays !== undefined ? durationDays : duration_days;
        const duration = rawDuration ? parseInt(rawDuration, 10) : null;
        if (duration !== null && (isNaN(duration) || duration <= 0)) {
            return res.status(400).json({
                success: false,
                message: "Duration days must be a positive integer",
            });
        }

        let expLevel = (experienceLevel || experience_level || "intermediate").trim().toLowerCase();
        if (expLevel === "entry") expLevel = "beginner";
        if (!["beginner", "intermediate", "expert"].includes(expLevel)) {
            return res.status(400).json({
                success: false,
                message: "Experience level must be 'beginner', 'intermediate', or 'expert'",
            });
        }

        const skillsArray = Array.isArray(skills)
            ? skills.map((s) => String(s).trim()).filter(Boolean)
            : typeof skills === "string"
            ? skills.split(",").map((s) => s.trim()).filter(Boolean)
            : [];

        const insertQuery = `
            INSERT INTO freelance_projects (
                client_id, title, description, category, skills,
                budget_type, budget_min, budget_max, currency,
                duration_days, experience_level, status, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'open', NOW(), NOW())
            RETURNING *
        `;

        const insertRes = await pool.query(insertQuery, [
            clientId,
            title.trim(),
            description.trim(),
            category.trim(),
            JSON.stringify(skillsArray),
            resolvedBudgetType,
            bMin,
            bMax,
            (currency || "INR").trim(),
            duration,
            expLevel,
        ]);

        const project = formatProject({
            ...insertRes.rows[0],
            client_name: req.user.name,
            proposal_count: 0,
        });

        return res.status(201).json({
            success: true,
            message: "Freelance project posted successfully",
            project,
        });
    } catch (error) {
        console.error("createProject error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create freelance project",
        });
    }
}

/**
 * PUT /api/freelance/projects/:id
 * Update project details (owner only, open status only).
 */
export async function updateProject(req, res) {
    try {
        const clientId = req.user.id;
        const { id } = req.params;

        if (!id || !UUID_REGEX.test(id)) {
            return res.status(400).json({
                success: false,
                message: "Valid project UUID is required",
            });
        }

        const existingRes = await pool.query(
            "SELECT * FROM freelance_projects WHERE id = $1",
            [id]
        );

        if (existingRes.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Freelance project not found",
            });
        }

        const project = existingRes.rows[0];

        if (project.client_id !== clientId) {
            return res.status(403).json({
                success: false,
                message: "Only the project owner can edit this project",
            });
        }

        if (project.status !== "open") {
            return res.status(400).json({
                success: false,
                message: `Projects in status '${project.status}' cannot be edited`,
            });
        }

        const {
            title,
            description,
            category,
            skills,
            budgetType,
            budget_type,
            budgetMin,
            budget_min,
            budgetMax,
            budget_max,
            durationDays,
            duration_days,
            experienceLevel,
            experience_level,
        } = req.body || {};

        const updateTitle = title ? title.trim() : project.title;
        const updateDescription = description ? description.trim() : project.description;
        const updateCategory = category ? category.trim() : project.category;
        const updateBudgetType = (budgetType || budget_type || project.budget_type).trim().toLowerCase();
        const updateExpLevel = (experienceLevel || experience_level || project.experience_level).trim().toLowerCase();

        const rawMin = budgetMin !== undefined ? budgetMin : budget_min !== undefined ? budget_min : project.budget_min;
        const rawMax = budgetMax !== undefined ? budgetMax : budget_max !== undefined ? budget_max : project.budget_max;
        const bMin = rawMin !== null && rawMin !== "" ? Number(rawMin) : null;
        const bMax = rawMax !== null && rawMax !== "" ? Number(rawMax) : null;

        const rawDur = durationDays !== undefined ? durationDays : duration_days !== undefined ? duration_days : project.duration_days;
        const duration = rawDur ? parseInt(rawDur, 10) : null;

        let skillsArray = project.skills;
        if (skills !== undefined) {
            skillsArray = Array.isArray(skills)
                ? skills.map((s) => String(s).trim()).filter(Boolean)
                : typeof skills === "string"
                ? skills.split(",").map((s) => s.trim()).filter(Boolean)
                : [];
        }

        const updateRes = await pool.query(
            `UPDATE freelance_projects
             SET title = $1, description = $2, category = $3, skills = $4,
                 budget_type = $5, budget_min = $6, budget_max = $7,
                 duration_days = $8, experience_level = $9, updated_at = NOW()
             WHERE id = $10
             RETURNING *`,
            [
                updateTitle,
                updateDescription,
                updateCategory,
                JSON.stringify(skillsArray),
                updateBudgetType,
                bMin,
                bMax,
                duration,
                updateExpLevel,
                id,
            ]
        );

        return res.status(200).json({
            success: true,
            message: "Project updated successfully",
            project: formatProject({
                ...updateRes.rows[0],
                client_name: req.user.name,
            }),
        });
    } catch (error) {
        console.error("updateProject error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update project",
        });
    }
}

/**
 * DELETE /api/freelance/projects/:id
 * Delete or cancel project. Safe marketplace check.
 */
export async function deleteProject(req, res) {
    try {
        const clientId = req.user.id;
        const { id } = req.params;

        if (!id || !UUID_REGEX.test(id)) {
            return res.status(400).json({
                success: false,
                message: "Valid project UUID is required",
            });
        }

        const projectRes = await pool.query(
            "SELECT * FROM freelance_projects WHERE id = $1",
            [id]
        );

        if (projectRes.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Freelance project not found",
            });
        }

        const project = projectRes.rows[0];

        if (project.client_id !== clientId) {
            return res.status(403).json({
                success: false,
                message: "Only the project owner can delete this project",
            });
        }

        // Check if an active contract exists
        const contractRes = await pool.query(
            "SELECT id FROM freelance_contracts WHERE project_id = $1 AND status = 'active'",
            [id]
        );

        if (contractRes.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Cannot delete a project with an active contract. Please resolve or cancel the contract first.",
            });
        }

        // If proposals or completed/cancelled contracts exist, transition status to cancelled for data integrity
        const proposalsRes = await pool.query(
            "SELECT COUNT(*)::int AS count FROM freelance_proposals WHERE project_id = $1",
            [id]
        );
        const proposalCount = proposalsRes.rows[0]?.count || 0;

        if (proposalCount > 0 || project.status !== "open") {
            await pool.query(
                "UPDATE freelance_projects SET status = 'cancelled', updated_at = NOW() WHERE id = $1",
                [id]
            );
            return res.status(200).json({
                success: true,
                message: "Project has been cancelled",
                status: "cancelled",
            });
        }

        // Clean delete if no proposals and open status
        await pool.query("DELETE FROM freelance_projects WHERE id = $1", [id]);

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

/**
 * POST /api/freelance/projects/:projectId/proposals
 * Submit proposal. Freelancer only. +5 XP award.
 */
export async function submitProposal(req, res) {
    const client = await pool.connect();
    try {
        const freelancerId = req.user.id;
        const { projectId } = req.params;
        const {
            cover_letter,
            coverLetter,
            proposed_amount,
            proposedAmount,
            estimated_days,
            estimatedDays,
        } = req.body || {};

        if (!projectId || !UUID_REGEX.test(projectId)) {
            return res.status(400).json({
                success: false,
                message: "Valid project UUID is required",
            });
        }

        // 1. Check project exists and is open
        const projectRes = await client.query(
            "SELECT id, client_id, title, status FROM freelance_projects WHERE id = $1",
            [projectId]
        );

        if (projectRes.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Freelance project not found",
            });
        }

        const project = projectRes.rows[0];

        if (project.status !== "open") {
            return res.status(400).json({
                success: false,
                message: "Proposals can only be submitted to open projects",
            });
        }

        // 2. Prevent self-proposals
        if (project.client_id === freelancerId) {
            return res.status(400).json({
                success: false,
                message: "You cannot submit a proposal to your own project",
            });
        }

        // 3. Validate inputs
        const letter = (cover_letter || coverLetter || "").trim();
        if (!letter) {
            return res.status(400).json({
                success: false,
                message: "Cover letter is required",
            });
        }

        const rawAmount = proposed_amount ?? proposedAmount ?? req.body?.bidAmount ?? req.body?.bid_amount;
        const amount = Number(rawAmount);
        if (rawAmount === undefined || isNaN(amount) || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Proposed amount must be greater than zero",
            });
        }

        const rawDays = estimated_days ?? estimatedDays ?? req.body?.deliveryDays ?? req.body?.delivery_days ?? req.body?.duration_days;
        const days = parseInt(rawDays, 10);
        if (rawDays === undefined || isNaN(days) || days <= 0) {
            return res.status(400).json({
                success: false,
                message: "Estimated delivery days must be a positive integer",
            });
        }

        // 4. Prevent duplicate proposals
        const existingRes = await client.query(
            "SELECT id FROM freelance_proposals WHERE project_id = $1 AND freelancer_id = $2",
            [projectId, freelancerId]
        );

        if (existingRes.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: "You have already submitted a proposal for this project",
            });
        }

        await client.query("BEGIN");

        // 5. Insert proposal
        const insertRes = await client.query(
            `INSERT INTO freelance_proposals (
                project_id, freelancer_id, cover_letter, proposed_amount,
                estimated_days, status, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, 'pending', NOW(), NOW())
            RETURNING *`,
            [projectId, freelancerId, letter, amount, days]
        );

        const proposal = insertRes.rows[0];

        // 6. Award +5 XP to freelancer
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
            [freelancerId]
        );

        // 7. Record user activity
        await client.query(
            `INSERT INTO user_activity (
                user_id, activity_type, title, description, xp_earned, metadata, created_at
            )
            VALUES ($1, 'freelance_proposal_submitted', $2, $3, 5, $4, NOW())`,
            [
                freelancerId,
                `Submitted Proposal for ${project.title}`,
                `Proposed ${amount} INR delivery in ${days} days`,
                JSON.stringify({
                    projectId: project.id,
                    proposalId: proposal.id,
                    projectTitle: project.title,
                    proposedAmount: amount,
                }),
            ]
        );

        // Notify project owner of new freelance proposal
        await createNotification({
            client,
            userId: project.client_id,
            type: "freelance_proposal_submitted",
            title: "New freelance proposal",
            message: `${req.user.name} submitted a proposal for ${project.title}.`,
            link: `/freelance/projects/${project.id}`,
            metadata: {
                projectId: project.id,
                proposalId: proposal.id,
                freelancerId,
                freelancerName: req.user.name,
                projectTitle: project.title,
            },
            eventKey: `freelance_proposal_submitted:${proposal.id}`,
        });

        await client.query("COMMIT");

        // 8. Evaluate achievements
        evaluateAchievements(freelancerId).catch((err) =>
            console.error("evaluateAchievements error in submitProposal:", err)
        );

        return res.status(201).json({
            success: true,
            message: "Proposal submitted successfully! (+5 XP)",
            proposal: {
                id: proposal.id,
                projectId: proposal.project_id,
                freelancerId: proposal.freelancer_id,
                coverLetter: proposal.cover_letter,
                proposedAmount: Number(proposal.proposed_amount),
                estimatedDays: proposal.estimated_days,
                status: proposal.status,
                createdAt: proposal.created_at,
                updatedAt: proposal.updated_at,
            },
            awardedXp: 5,
        });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("submitProposal error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to submit proposal",
        });
    } finally {
        client.release();
    }
}

/**
 * GET /api/freelance/proposals
 * Current user's submitted proposals.
 */
export async function getMyProposals(req, res) {
    try {
        const freelancerId = req.user.id;
        const { status, page = 1, limit = 20 } = req.query;

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
        const offset = (pageNum - 1) * limitNum;

        const conditions = ["fp.freelancer_id = $1"];
        const params = [freelancerId];

        if (status && status.trim() && status.trim().toLowerCase() !== "all") {
            params.push(status.trim().toLowerCase());
            conditions.push(`fp.status = $${params.length}`);
        }

        const whereClause = `WHERE ${conditions.join(" AND ")}`;

        const countRes = await pool.query(
            `SELECT COUNT(*)::int AS total FROM freelance_proposals fp ${whereClause}`,
            params
        );
        const total = countRes.rows[0]?.total || 0;

        params.push(limitNum);
        const limitIdx = params.length;
        params.push(offset);
        const offsetIdx = params.length;

        const dataQuery = `
            SELECT 
                fp.id, fp.project_id, fp.freelancer_id, fp.cover_letter,
                fp.proposed_amount, fp.estimated_days, fp.status, fp.created_at, fp.updated_at,
                p.title AS project_title, p.category AS project_category,
                p.budget_type, p.budget_min, p.budget_max, p.currency, p.status AS project_status,
                u.name AS client_name
            FROM freelance_proposals fp
            JOIN freelance_projects p ON fp.project_id = p.id
            JOIN users u ON p.client_id = u.id
            ${whereClause}
            ORDER BY fp.created_at DESC
            LIMIT $${limitIdx} OFFSET $${offsetIdx}
        `;

        const dataRes = await pool.query(dataQuery, params);

        const proposals = dataRes.rows.map((r) => ({
            id: r.id,
            projectId: r.project_id,
            freelancerId: r.freelancer_id,
            coverLetter: r.cover_letter,
            proposedAmount: Number(r.proposed_amount),
            estimatedDays: r.estimated_days,
            status: r.status,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
            project: {
                id: r.project_id,
                title: r.project_title,
                category: r.project_category,
                budgetType: r.budget_type,
                budgetMin: r.budget_min !== null ? Number(r.budget_min) : null,
                budgetMax: r.budget_max !== null ? Number(r.budget_max) : null,
                currency: r.currency,
                status: r.project_status,
                clientName: r.client_name,
            },
        }));

        return res.status(200).json({
            success: true,
            proposals,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum) || 1,
            },
        });
    } catch (error) {
        console.error("getMyProposals error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch submitted proposals",
        });
    }
}

/**
 * GET /api/freelance/proposals/:id
 * Proposal detail for owner or project owner.
 */
export async function getProposal(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        if (!id || !UUID_REGEX.test(id)) {
            return res.status(400).json({
                success: false,
                message: "Valid proposal UUID is required",
            });
        }

        const query = `
            SELECT 
                fp.id, fp.project_id, fp.freelancer_id, fp.cover_letter,
                fp.proposed_amount, fp.estimated_days, fp.status, fp.created_at, fp.updated_at,
                p.client_id, p.title AS project_title, p.category AS project_category,
                p.status AS project_status, p.budget_type, p.currency,
                u_free.name AS freelancer_name, prof_free.avatar_url AS freelancer_avatar,
                prof_free.college AS freelancer_college,
                u_client.name AS client_name
            FROM freelance_proposals fp
            JOIN freelance_projects p ON fp.project_id = p.id
            JOIN users u_free ON fp.freelancer_id = u_free.id
            LEFT JOIN profiles prof_free ON u_free.id = prof_free.id
            JOIN users u_client ON p.client_id = u_client.id
            WHERE fp.id = $1
        `;

        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Proposal not found",
            });
        }

        const row = result.rows[0];

        // Access control: only proposal owner OR project client
        if (row.freelancer_id !== userId && row.client_id !== userId) {
            return res.status(403).json({
                success: false,
                message: "Access denied to this proposal",
            });
        }

        return res.status(200).json({
            success: true,
            proposal: {
                id: row.id,
                projectId: row.project_id,
                freelancerId: row.freelancer_id,
                coverLetter: row.cover_letter,
                proposedAmount: Number(row.proposed_amount),
                estimatedDays: row.estimated_days,
                status: row.status,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                project: {
                    id: row.project_id,
                    title: row.project_title,
                    category: row.project_category,
                    status: row.project_status,
                    budgetType: row.budget_type,
                    currency: row.currency,
                    clientName: row.client_name,
                },
                freelancer: {
                    id: row.freelancer_id,
                    name: row.freelancer_name,
                    avatarUrl: row.freelancer_avatar,
                    college: row.freelancer_college,
                },
            },
        });
    } catch (error) {
        console.error("getProposal error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch proposal details",
        });
    }
}

/**
 * PATCH /api/freelance/proposals/:id/withdraw
 * Freelancer withdraws pending proposal.
 */
export async function withdrawProposal(req, res) {
    try {
        const freelancerId = req.user.id;
        const { id } = req.params;

        if (!id || !UUID_REGEX.test(id)) {
            return res.status(400).json({
                success: false,
                message: "Valid proposal UUID is required",
            });
        }

        const propRes = await pool.query(
            "SELECT * FROM freelance_proposals WHERE id = $1",
            [id]
        );

        if (propRes.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Proposal not found",
            });
        }

        const proposal = propRes.rows[0];

        if (proposal.freelancer_id !== freelancerId) {
            return res.status(403).json({
                success: false,
                message: "Only the author can withdraw this proposal",
            });
        }

        if (proposal.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: `Proposals in status '${proposal.status}' cannot be withdrawn`,
            });
        }

        await pool.query(
            "UPDATE freelance_proposals SET status = 'withdrawn', updated_at = NOW() WHERE id = $1",
            [id]
        );

        return res.status(200).json({
            success: true,
            message: "Proposal withdrawn successfully",
            status: "withdrawn",
            proposal: {
                id,
                status: "withdrawn",
            },
        });
    } catch (error) {
        console.error("withdrawProposal error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to withdraw proposal",
        });
    }
}

/**
 * GET /api/freelance/projects/:projectId/proposals
 * Project owner views all proposals submitted to their project.
 */
export async function getProjectProposals(req, res) {
    try {
        const clientId = req.user.id;
        const { projectId } = req.params;

        if (!projectId || !UUID_REGEX.test(projectId)) {
            return res.status(400).json({
                success: false,
                message: "Valid project UUID is required",
            });
        }

        // Verify project ownership
        const projectRes = await pool.query(
            "SELECT id, client_id, title FROM freelance_projects WHERE id = $1",
            [projectId]
        );

        if (projectRes.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Freelance project not found",
            });
        }

        if (projectRes.rows[0].client_id !== clientId) {
            return res.status(403).json({
                success: false,
                message: "Only the project owner can view received proposals",
            });
        }

        const query = `
            SELECT 
                fp.id, fp.project_id, fp.freelancer_id, fp.cover_letter,
                fp.proposed_amount, fp.estimated_days, fp.status, fp.created_at, fp.updated_at,
                u.name AS freelancer_name, prof.college AS freelancer_college,
                prof.avatar_url AS freelancer_avatar,
                (SELECT jsonb_agg(jsonb_build_object('name', s.name, 'proficiency', s.proficiency)) FROM skills s WHERE s.user_id = u.id) AS skills
            FROM freelance_proposals fp
            JOIN users u ON fp.freelancer_id = u.id
            LEFT JOIN profiles prof ON u.id = prof.id
            WHERE fp.project_id = $1
            ORDER BY fp.created_at DESC
        `;

        const proposalsRes = await pool.query(query, [projectId]);

        const proposals = proposalsRes.rows.map((r) => ({
            id: r.id,
            projectId: r.project_id,
            freelancerId: r.freelancer_id,
            coverLetter: r.cover_letter,
            proposedAmount: Number(r.proposed_amount),
            estimatedDays: r.estimated_days,
            status: r.status,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
            freelancer: {
                id: r.freelancer_id,
                name: r.freelancer_name,
                college: r.freelancer_college,
                avatarUrl: r.freelancer_avatar,
                skills: Array.isArray(r.skills) ? r.skills : [],
            },
        }));

        return res.status(200).json({
            success: true,
            proposals,
            projectTitle: projectRes.rows[0].title,
        });
    } catch (error) {
        console.error("getProjectProposals error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch project proposals",
        });
    }
}

/**
 * POST /api/freelance/proposals/:proposalId/accept
 * Project owner accepts a proposal. Atomic transaction.
 * Creates contract, rejects remaining pending proposals, marks project in_progress.
 */
export async function acceptProposal(req, res) {
    const client = await pool.connect();
    try {
        const ownerId = req.user.id;
        const { proposalId } = req.params;

        if (!proposalId || !UUID_REGEX.test(proposalId)) {
            return res.status(400).json({
                success: false,
                message: "Valid proposal UUID is required",
            });
        }

        await client.query("BEGIN");

        // 1. Lock proposal & verify
        const propRes = await client.query(
            `SELECT fp.id, fp.project_id, fp.freelancer_id, fp.proposed_amount, fp.status
             FROM freelance_proposals fp
             WHERE fp.id = $1
             FOR UPDATE`,
            [proposalId]
        );

        if (propRes.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({
                success: false,
                message: "Proposal not found",
            });
        }

        const proposal = propRes.rows[0];

        // 2. Lock project & verify ownership and open status
        const projRes = await client.query(
            `SELECT id, client_id, title, status, currency
             FROM freelance_projects
             WHERE id = $1
             FOR UPDATE`,
            [proposal.project_id]
        );

        if (projRes.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({
                success: false,
                message: "Associated freelance project not found",
            });
        }

        const project = projRes.rows[0];

        if (project.client_id !== ownerId) {
            await client.query("ROLLBACK");
            return res.status(403).json({
                success: false,
                message: "Only the project owner can accept proposals",
            });
        }

        if (project.status !== "open") {
            await client.query("ROLLBACK");
            return res.status(400).json({
                success: false,
                message: `Project is already in status '${project.status}' and cannot accept new proposals`,
            });
        }

        if (proposal.status !== "pending") {
            await client.query("ROLLBACK");
            return res.status(400).json({
                success: false,
                message: `Proposals in status '${proposal.status}' cannot be accepted`,
            });
        }

        // 3. Verify no active contract exists
        const existingContractRes = await client.query(
            "SELECT id FROM freelance_contracts WHERE project_id = $1 AND status = 'active'",
            [project.id]
        );

        if (existingContractRes.rows.length > 0) {
            await client.query("ROLLBACK");
            return res.status(400).json({
                success: false,
                message: "An active contract already exists for this project",
            });
        }

        // 4. Create contract
        const contractRes = await client.query(
            `INSERT INTO freelance_contracts (
                project_id, proposal_id, client_id, freelancer_id,
                agreed_amount, currency, status, started_at, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW(), NOW(), NOW())
            RETURNING *`,
            [
                project.id,
                proposal.id,
                ownerId,
                proposal.freelancer_id,
                proposal.proposed_amount,
                project.currency || "INR",
            ]
        );

        const contract = contractRes.rows[0];

        // 5. Update accepted proposal
        await client.query(
            "UPDATE freelance_proposals SET status = 'accepted', updated_at = NOW() WHERE id = $1",
            [proposal.id]
        );

        // 6. Find other pending proposals to notify their freelancers of rejection
        const otherProposalsRes = await client.query(
            "SELECT id, freelancer_id FROM freelance_proposals WHERE project_id = $1 AND id != $2 AND status = 'pending'",
            [project.id, proposal.id]
        );

        // Reject other pending proposals for this project
        await client.query(
            "UPDATE freelance_proposals SET status = 'rejected', updated_at = NOW() WHERE project_id = $1 AND id != $2 AND status = 'pending'",
            [project.id, proposal.id]
        );

        // 7. Update project status to in_progress
        await client.query(
            "UPDATE freelance_projects SET status = 'in_progress', updated_at = NOW() WHERE id = $1",
            [project.id]
        );

        // Notify accepted freelancer of proposal accept
        await createNotification({
            client,
            userId: proposal.freelancer_id,
            type: "freelance_proposal_accepted",
            title: "Proposal accepted",
            message: `Your proposal for ${project.title} was accepted.`,
            link: `/freelance/contracts/${contract.id}`,
            metadata: {
                proposalId: proposal.id,
                projectId: project.id,
                contractId: contract.id,
                projectTitle: project.title,
            },
            eventKey: `freelance_proposal_accepted:${proposal.id}`,
        });

        // Notify accepted freelancer of contract start
        await createNotification({
            client,
            userId: proposal.freelancer_id,
            type: "freelance_contract_started",
            title: "Freelance contract started",
            message: `Freelance contract started for "${project.title}".`,
            link: `/freelance/contracts/${contract.id}`,
            metadata: {
                contractId: contract.id,
                projectId: project.id,
                projectTitle: project.title,
            },
            eventKey: `freelance_contract_started:${contract.id}`,
        });

        // Notify competing freelancers whose proposals were rejected
        for (const other of otherProposalsRes.rows) {
            await createNotification({
                client,
                userId: other.freelancer_id,
                type: "freelance_proposal_rejected",
                title: "Proposal rejected",
                message: `Your proposal for ${project.title} was rejected.`,
                link: `/freelance/proposals`,
                metadata: {
                    proposalId: other.id,
                    projectId: project.id,
                    projectTitle: project.title,
                },
                eventKey: `freelance_proposal_rejected:${other.id}`,
            });
        }

        await client.query("COMMIT");

        return res.status(200).json({
            success: true,
            message: "Proposal accepted and active contract created",
            proposal: {
                id: proposal.id,
                status: "accepted",
            },
            contract: {
                id: contract.id,
                projectId: contract.project_id,
                proposalId: contract.proposal_id,
                clientId: contract.client_id,
                freelancerId: contract.freelancer_id,
                agreedAmount: Number(contract.agreed_amount),
                currency: contract.currency,
                status: contract.status,
                startedAt: contract.started_at,
            },
        });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("acceptProposal error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to accept proposal",
        });
    } finally {
        client.release();
    }
}

/**
 * POST /api/freelance/proposals/:proposalId/reject
 * Project owner rejects a pending proposal.
 */
export async function rejectProposal(req, res) {
    try {
        const ownerId = req.user.id;
        const { proposalId } = req.params;

        if (!proposalId || !UUID_REGEX.test(proposalId)) {
            return res.status(400).json({
                success: false,
                message: "Valid proposal UUID is required",
            });
        }

        const propRes = await pool.query(
            `SELECT fp.id, fp.freelancer_id, fp.status, p.client_id, p.id AS project_id, p.title AS project_title
             FROM freelance_proposals fp
             JOIN freelance_projects p ON fp.project_id = p.id
             WHERE fp.id = $1`,
            [proposalId]
        );

        if (propRes.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Proposal not found",
            });
        }

        const proposal = propRes.rows[0];

        if (proposal.client_id !== ownerId) {
            return res.status(403).json({
                success: false,
                message: "Only the project owner can reject proposals",
            });
        }

        if (proposal.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: `Proposals in status '${proposal.status}' cannot be rejected`,
            });
        }

        await pool.query(
            "UPDATE freelance_proposals SET status = 'rejected', updated_at = NOW() WHERE id = $1",
            [proposalId]
        );

        // Notify freelancer that proposal was rejected
        await createNotification({
            userId: proposal.freelancer_id,
            type: "freelance_proposal_rejected",
            title: "Proposal rejected",
            message: `Your proposal for ${proposal.project_title} was rejected.`,
            link: `/freelance/proposals`,
            metadata: {
                proposalId: proposal.id,
                projectId: proposal.project_id,
                projectTitle: proposal.project_title,
            },
            eventKey: `freelance_proposal_rejected:${proposal.id}`,
        });

        return res.status(200).json({
            success: true,
            message: "Proposal rejected",
            status: "rejected",
            proposal: {
                id: proposalId,
                status: "rejected",
            },
        });
    } catch (error) {
        console.error("rejectProposal error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to reject proposal",
        });
    }
}

/**
 * GET /api/freelance/contracts
 * Contracts where current user is client or freelancer.
 */
export async function getContracts(req, res) {
    try {
        const userId = req.user.id;
        const { status, page = 1, limit = 20 } = req.query;

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
        const offset = (pageNum - 1) * limitNum;

        const conditions = ["(c.client_id = $1 OR c.freelancer_id = $1)"];
        const params = [userId];

        if (status && status.trim() && status.trim().toLowerCase() !== "all") {
            params.push(status.trim().toLowerCase());
            conditions.push(`c.status = $${params.length}`);
        }

        const whereClause = `WHERE ${conditions.join(" AND ")}`;

        const countRes = await pool.query(
            `SELECT COUNT(*)::int AS total FROM freelance_contracts c ${whereClause}`,
            params
        );
        const total = countRes.rows[0]?.total || 0;

        params.push(limitNum);
        const limitIdx = params.length;
        params.push(offset);
        const offsetIdx = params.length;

        const dataQuery = `
            SELECT 
                c.id, c.project_id, c.proposal_id, c.client_id, c.freelancer_id,
                c.agreed_amount, c.currency, c.status, c.started_at, c.completed_at,
                c.created_at, c.updated_at,
                p.title AS project_title, p.category AS project_category,
                u_client.name AS client_name, u_free.name AS freelancer_name
            FROM freelance_contracts c
            JOIN freelance_projects p ON c.project_id = p.id
            JOIN users u_client ON c.client_id = u_client.id
            JOIN users u_free ON c.freelancer_id = u_free.id
            ${whereClause}
            ORDER BY c.created_at DESC
            LIMIT $${limitIdx} OFFSET $${offsetIdx}
        `;

        const dataRes = await pool.query(dataQuery, params);

        const contracts = dataRes.rows.map((r) => ({
            id: r.id,
            projectId: r.project_id,
            proposalId: r.proposal_id,
            clientId: r.client_id,
            freelancerId: r.freelancer_id,
            agreedAmount: Number(r.agreed_amount),
            agreedBudget: Number(r.agreed_amount),
            currency: r.currency,
            status: r.status,
            startedAt: r.started_at,
            completedAt: r.completed_at,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
            project: {
                id: r.project_id,
                title: r.project_title,
                category: r.project_category,
            },
            client: {
                id: r.client_id,
                name: r.client_name,
            },
            freelancer: {
                id: r.freelancer_id,
                name: r.freelancer_name,
            },
            isClient: r.client_id === userId,
            isFreelancer: r.freelancer_id === userId,
        }));

        return res.status(200).json({
            success: true,
            contracts,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum) || 1,
            },
        });
    } catch (error) {
        console.error("getContracts error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch contracts",
        });
    }
}

/**
 * GET /api/freelance/contracts/:id
 * Contract detail for participant.
 */
export async function getContract(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        if (!id || !UUID_REGEX.test(id)) {
            return res.status(400).json({
                success: false,
                message: "Valid contract UUID is required",
            });
        }

        const query = `
            SELECT 
                c.id, c.project_id, c.proposal_id, c.client_id, c.freelancer_id,
                c.agreed_amount, c.currency, c.status, c.started_at, c.completed_at,
                c.created_at, c.updated_at,
                p.title AS project_title, p.description AS project_description,
                p.category AS project_category,
                u_client.name AS client_name, prof_client.avatar_url AS client_avatar,
                u_free.name AS freelancer_name, prof_free.avatar_url AS freelancer_avatar
            FROM freelance_contracts c
            JOIN freelance_projects p ON c.project_id = p.id
            JOIN users u_client ON c.client_id = u_client.id
            LEFT JOIN profiles prof_client ON u_client.id = prof_client.id
            JOIN users u_free ON c.freelancer_id = u_free.id
            LEFT JOIN profiles prof_free ON u_free.id = prof_free.id
            WHERE c.id = $1
        `;

        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Contract not found",
            });
        }

        const row = result.rows[0];

        if (row.client_id !== userId && row.freelancer_id !== userId) {
            return res.status(403).json({
                success: false,
                message: "Access denied to this contract",
            });
        }

        return res.status(200).json({
            success: true,
            contract: {
                id: row.id,
                projectId: row.project_id,
                proposalId: row.proposal_id,
                clientId: row.client_id,
                freelancerId: row.freelancer_id,
                agreedAmount: Number(row.agreed_amount),
                agreedBudget: Number(row.agreed_amount),
                currency: row.currency,
                status: row.status,
                startedAt: row.started_at,
                completedAt: row.completed_at,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                project: {
                    id: row.project_id,
                    title: row.project_title,
                    description: row.project_description,
                    category: row.project_category,
                },
                client: {
                    id: row.client_id,
                    name: row.client_name,
                    avatarUrl: row.client_avatar,
                },
                freelancer: {
                    id: row.freelancer_id,
                    name: row.freelancer_name,
                    avatarUrl: row.freelancer_avatar,
                },
                isClient: row.client_id === userId,
                isFreelancer: row.freelancer_id === userId,
            },
        });
    } catch (error) {
        console.error("getContract error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch contract details",
        });
    }
}

/**
 * POST /api/freelance/contracts/:id/complete
 * Client completes contract. Awards +25 XP to freelancer. Atomic transaction.
 */
export async function completeContract(req, res) {
    const client = await pool.connect();
    try {
        const clientId = req.user.id;
        const { id } = req.params;

        if (!id || !UUID_REGEX.test(id)) {
            return res.status(400).json({
                success: false,
                message: "Valid contract UUID is required",
            });
        }

        await client.query("BEGIN");

        const contractRes = await client.query(
            `SELECT c.id, c.project_id, c.client_id, c.freelancer_id, c.agreed_amount, c.currency, c.status,
                    p.title AS project_title
             FROM freelance_contracts c
             JOIN freelance_projects p ON c.project_id = p.id
             WHERE c.id = $1
             FOR UPDATE`,
            [id]
        );

        if (contractRes.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({
                success: false,
                message: "Contract not found",
            });
        }

        const contract = contractRes.rows[0];

        if (contract.client_id !== clientId) {
            await client.query("ROLLBACK");
            return res.status(403).json({
                success: false,
                message: "Only the client can mark this contract as completed",
            });
        }

        if (contract.status !== "active") {
            await client.query("ROLLBACK");
            return res.status(400).json({
                success: false,
                message: `Contracts in status '${contract.status}' cannot be completed`,
            });
        }

        // 1. Update contract to completed
        await client.query(
            "UPDATE freelance_contracts SET status = 'completed', completed_at = NOW(), updated_at = NOW() WHERE id = $1",
            [id]
        );

        // 2. Update project to completed
        await client.query(
            "UPDATE freelance_projects SET status = 'completed', updated_at = NOW() WHERE id = $1",
            [contract.project_id]
        );

        // 3. Award +25 XP to freelancer
        await client.query(
            `INSERT INTO student_progress (
                user_id, total_xp, current_streak, longest_streak,
                problems_solved, courses_completed, projects_completed,
                created_at, updated_at
            )
            VALUES ($1, 25, 0, 0, 0, 0, 0, NOW(), NOW())
            ON CONFLICT (user_id) DO UPDATE SET
                total_xp = student_progress.total_xp + 25,
                updated_at = NOW()`,
            [contract.freelancer_id]
        );

        // 4. Create user activity for freelancer
        await client.query(
            `INSERT INTO user_activity (
                user_id, activity_type, title, description, xp_earned, metadata, created_at
            )
            VALUES ($1, 'freelance_contract_completed', $2, $3, 25, $4, NOW())`,
            [
                contract.freelancer_id,
                `Completed Contract: ${contract.project_title}`,
                `Delivered contract valued at ${contract.agreed_amount} ${contract.currency}`,
                JSON.stringify({
                    contractId: contract.id,
                    projectId: contract.project_id,
                    projectTitle: contract.project_title,
                    agreedAmount: Number(contract.agreed_amount),
                    currency: contract.currency,
                }),
            ]
        );

        // Create notification for freelancer that contract was completed
        await createNotification({
            client,
            userId: contract.freelancer_id,
            type: "freelance_contract_completed",
            title: "Freelance contract completed",
            message: `Freelance contract completed for "${contract.project_title}".`,
            link: `/freelance/contracts/${contract.id}`,
            metadata: {
                contractId: contract.id,
                projectId: contract.project_id,
                projectTitle: contract.project_title,
            },
            eventKey: `freelance_contract_completed:${contract.id}`,
        });

        await client.query("COMMIT");

        // Evaluate achievements for freelancer
        evaluateAchievements(contract.freelancer_id).catch((err) =>
            console.error("evaluateAchievements error in completeContract:", err)
        );

        return res.status(200).json({
            success: true,
            message: "Contract marked as completed! Freelancer awarded +25 XP.",
            status: "completed",
            contract: {
                id: contract.id,
                projectId: contract.project_id,
                status: "completed",
            },
        });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("completeContract error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to complete contract",
        });
    } finally {
        client.release();
    }
}

/**
 * POST /api/freelance/contracts/:id/cancel
 * Client or Freelancer cancels an active contract.
 */
export async function cancelContract(req, res) {
    const client = await pool.connect();
    try {
        const userId = req.user.id;
        const { id } = req.params;

        if (!id || !UUID_REGEX.test(id)) {
            return res.status(400).json({
                success: false,
                message: "Valid contract UUID is required",
            });
        }

        await client.query("BEGIN");

        const contractRes = await client.query(
            `SELECT c.id, c.project_id, c.client_id, c.freelancer_id, c.status, p.title AS project_title
             FROM freelance_contracts c
             JOIN freelance_projects p ON c.project_id = p.id
             WHERE c.id = $1
             FOR UPDATE`,
            [id]
        );

        if (contractRes.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({
                success: false,
                message: "Contract not found",
            });
        }

        const contract = contractRes.rows[0];

        if (contract.client_id !== userId && contract.freelancer_id !== userId) {
            await client.query("ROLLBACK");
            return res.status(403).json({
                success: false,
                message: "Only contract participants can cancel this contract",
            });
        }

        if (contract.status !== "active") {
            await client.query("ROLLBACK");
            return res.status(400).json({
                success: false,
                message: `Contracts in status '${contract.status}' cannot be cancelled`,
            });
        }

        // 1. Cancel contract
        await client.query(
            "UPDATE freelance_contracts SET status = 'cancelled', updated_at = NOW() WHERE id = $1",
            [id]
        );

        // 2. Cancel project
        await client.query(
            "UPDATE freelance_projects SET status = 'cancelled', updated_at = NOW() WHERE id = $1",
            [contract.project_id]
        );

        // 3. Notify relevant participant (the other participant)
        const targetUserId = (userId === contract.client_id) ? contract.freelancer_id : contract.client_id;
        await createNotification({
            client,
            userId: targetUserId,
            type: "freelance_contract_cancelled",
            title: "Freelance contract cancelled",
            message: `Freelance contract for "${contract.project_title || 'project'}" has been cancelled.`,
            link: `/freelance/contracts/${contract.id}`,
            metadata: {
                contractId: contract.id,
                projectId: contract.project_id,
                cancelledBy: userId,
            },
            eventKey: `freelance_contract_cancelled:${contract.id}:${targetUserId}`,
        });

        await client.query("COMMIT");

        return res.status(200).json({
            success: true,
            message: "Contract and associated project cancelled",
            status: "cancelled",
            contract: {
                id: contract.id,
                projectId: contract.project_id,
                status: "cancelled",
            },
        });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("cancelContract error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to cancel contract",
        });
    } finally {
        client.release();
    }
}

/**
 * POST /api/freelance/projects/:id/save
 * Bookmark project.
 */
export async function saveProject(req, res) {
    try {
        const freelancerId = req.user.id;
        const { id } = req.params;

        if (!id || !UUID_REGEX.test(id)) {
            return res.status(400).json({
                success: false,
                message: "Valid project UUID is required",
            });
        }

        const projectRes = await pool.query(
            "SELECT id FROM freelance_projects WHERE id = $1",
            [id]
        );

        if (projectRes.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Freelance project not found",
            });
        }

        await pool.query(
            `INSERT INTO freelance_saved_projects (freelancer_id, project_id, created_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (freelancer_id, project_id) DO NOTHING`,
            [freelancerId, id]
        );

        return res.status(200).json({
            success: true,
            isSaved: true,
            message: "Project saved successfully",
        });
    } catch (error) {
        console.error("saveProject error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to save project",
        });
    }
}

/**
 * DELETE /api/freelance/projects/:id/save
 * Remove saved project bookmark.
 */
export async function unsaveProject(req, res) {
    try {
        const freelancerId = req.user.id;
        const { id } = req.params;

        if (!id || !UUID_REGEX.test(id)) {
            return res.status(400).json({
                success: false,
                message: "Valid project UUID is required",
            });
        }

        await pool.query(
            "DELETE FROM freelance_saved_projects WHERE freelancer_id = $1 AND project_id = $2",
            [freelancerId, id]
        );

        return res.status(200).json({
            success: true,
            isSaved: false,
            message: "Project removed from saved list",
        });
    } catch (error) {
        console.error("unsaveProject error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to unsave project",
        });
    }
}

/**
 * GET /api/freelance/saved
 * Return authenticated user's saved projects.
 */
export async function getSavedProjects(req, res) {
    try {
        const freelancerId = req.user.id;

        const result = await pool.query(
            `SELECT 
                sp.created_at AS saved_at,
                p.id, p.client_id, p.title, p.description, p.category, p.skills,
                p.budget_type, p.budget_min, p.budget_max, p.currency, p.duration_days,
                p.experience_level, p.status, p.created_at, p.updated_at,
                u.name AS client_name,
                (SELECT COUNT(*)::int FROM freelance_proposals fp WHERE fp.project_id = p.id) AS proposal_count
             FROM freelance_saved_projects sp
             JOIN freelance_projects p ON sp.project_id = p.id
             JOIN users u ON p.client_id = u.id
             WHERE sp.freelancer_id = $1
             ORDER BY sp.created_at DESC`,
            [freelancerId]
        );

        const savedProjects = result.rows.map((r) => ({
            projectId: r.id,
            savedAt: r.saved_at,
            project: formatProject({
                ...r,
                is_saved: true,
            }),
        }));

        return res.status(200).json({
            success: true,
            savedProjects,
        });
    } catch (error) {
        console.error("getSavedProjects error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch saved projects",
        });
    }
}

/**
 * GET /api/freelance/earnings
 * Authenticated user's contract value & completion analytics (as freelancer).
 */
export async function getEarnings(req, res) {
    try {
        const freelancerId = req.user.id;

        const statsRes = await pool.query(
            `SELECT 
                COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_count,
                COALESCE(SUM(agreed_amount) FILTER (WHERE status = 'completed'), 0)::numeric AS completed_value,
                COUNT(*) FILTER (WHERE status = 'active')::int AS active_count,
                COALESCE(SUM(agreed_amount) FILTER (WHERE status = 'active'), 0)::numeric AS active_value
             FROM freelance_contracts
             WHERE freelancer_id = $1`,
            [freelancerId]
        );

        const stats = statsRes.rows[0] || {};
        const completedCount = Number(stats.completed_count || 0);
        const completedValue = Number(stats.completed_value || 0);
        const activeCount = Number(stats.active_count || 0);
        const activeValue = Number(stats.active_value || 0);

        return res.status(200).json({
            success: true,
            earnings: {
                completedContracts: completedCount,
                completedContractsCount: completedCount,
                completedContractValue: completedValue,
                totalCompletedValue: completedValue,
                activeContracts: activeCount,
                activeContractsCount: activeCount,
                pendingContractValue: activeValue,
                estimatedEarnings: activeValue,
                totalContractsCount: completedCount + activeCount,
                currency: "USD",
            },
        });
    } catch (error) {
        console.error("getEarnings error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch earnings statistics",
        });
    }
}
