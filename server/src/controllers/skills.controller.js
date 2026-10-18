import pool from "../db.js";
import { recordActivity } from "./activity.controller.js";
import { evaluateAchievements } from "../services/achievement.service.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Allowed proficiency levels
const VALID_PROFICIENCIES = ["Beginner", "Intermediate", "Advanced", "Expert"];

// ======================================================
// GET /api/skills
// Return only the authenticated user's skills
// ======================================================
export const getSkills = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            `SELECT id, name, category, proficiency, created_at, updated_at
             FROM skills
             WHERE user_id = $1
             ORDER BY created_at ASC`,
            [userId]
        );

        const skills = result.rows.map((row) => ({
            ...row,
            level: row.proficiency, // convenience alias
        }));

        return res.status(200).json({
            success: true,
            skills,
        });
    } catch (error) {
        console.error("Get skills error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve skills",
        });
    }
};

// ======================================================
// POST /api/skills
// Add a new skill for the authenticated user
// ======================================================
export const createSkill = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, category, proficiency, level } = req.body;

        const trimmedName = typeof name === "string" ? name.trim() : "";
        if (!trimmedName) {
            return res.status(400).json({
                success: false,
                message: "Skill name is required",
            });
        }

        if (trimmedName.length > 100) {
            return res.status(400).json({
                success: false,
                message: "Skill name cannot exceed 100 characters",
            });
        }

        const trimmedCategory = typeof category === "string" && category.trim()
            ? category.trim().slice(0, 100)
            : "Other";

        const rawProficiency = typeof proficiency === "string" && proficiency.trim()
            ? proficiency.trim()
            : typeof level === "string" && level.trim()
            ? level.trim()
            : "Intermediate";

        // Standardize proficiency casing if matches
        const matchedProficiency = VALID_PROFICIENCIES.find(
            (p) => p.toLowerCase() === rawProficiency.toLowerCase()
        ) || rawProficiency.slice(0, 50);

        // Check for duplicate skill under this user
        const existing = await pool.query(
            "SELECT id FROM skills WHERE user_id = $1 AND LOWER(name) = LOWER($2)",
            [userId, trimmedName]
        );

        if (existing.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: `Skill "${trimmedName}" has already been added to your profile`,
            });
        }

        const result = await pool.query(
            `INSERT INTO skills (user_id, name, category, proficiency, created_at, updated_at)
             VALUES ($1, $2, $3, $4, NOW(), NOW())
             RETURNING id, name, category, proficiency, created_at, updated_at`,
            [userId, trimmedName, trimmedCategory, matchedProficiency]
        );

        const newSkill = result.rows[0];

        // Trusted activity generation: +5 XP for adding a new skill
        try {
            await recordActivity({
                userId,
                activityType: "skill_added",
                title: "Added a new skill",
                description: `Added "${trimmedName}" to profile skills`,
                xpEarned: 5,
                metadata: {
                    skillId: newSkill.id,
                    skillName: trimmedName,
                    category: trimmedCategory,
                    proficiency: matchedProficiency,
                },
            });
        } catch (actErr) {
            console.error("Failed to record skill creation activity:", actErr);
        }

        // Evaluate achievements (e.g. FIRST_STEP, SKILL_BUILDER)
        try {
            await evaluateAchievements(userId);
        } catch (achErr) {
            console.error("Failed to evaluate achievements after skill creation:", achErr);
        }

        return res.status(201).json({
            success: true,
            message: "Skill added successfully",
            skill: {
                ...newSkill,
                level: newSkill.proficiency,
            },
        });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "A skill with this name already exists on your profile",
            });
        }

        console.error("Create skill error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to add skill",
        });
    }
};

// ======================================================
// PUT /api/skills/:id
// Update an existing skill belonging to the authenticated user
// ======================================================
export const updateSkill = async (req, res) => {
    try {
        const userId = req.user.id;
        const skillId = req.params.id;

        if (!UUID_REGEX.test(skillId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid skill ID format",
            });
        }

        // Verify existence and ownership
        const existing = await pool.query(
            "SELECT id, user_id, name, category, proficiency FROM skills WHERE id = $1",
            [skillId]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Skill not found",
            });
        }

        const targetSkill = existing.rows[0];

        // Enforce user ownership
        if (targetSkill.user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: You do not have permission to update this skill",
            });
        }

        const { name, category, proficiency, level } = req.body;

        const updatedName = typeof name === "string" && name.trim()
            ? name.trim().slice(0, 100)
            : targetSkill.name;

        const updatedCategory = typeof category === "string" && category.trim()
            ? category.trim().slice(0, 100)
            : targetSkill.category;

        const rawProficiency = typeof proficiency === "string" && proficiency.trim()
            ? proficiency.trim()
            : typeof level === "string" && level.trim()
            ? level.trim()
            : targetSkill.proficiency;

        const matchedProficiency = VALID_PROFICIENCIES.find(
            (p) => p.toLowerCase() === rawProficiency.toLowerCase()
        ) || rawProficiency.slice(0, 50);

        // Check for duplicate name if renaming
        if (updatedName.toLowerCase() !== targetSkill.name.toLowerCase()) {
            const dupCheck = await pool.query(
                "SELECT id FROM skills WHERE user_id = $1 AND LOWER(name) = LOWER($2) AND id != $3",
                [userId, updatedName, skillId]
            );

            if (dupCheck.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: `Another skill with the name "${updatedName}" already exists on your profile`,
                });
            }
        }

        const result = await pool.query(
            `UPDATE skills
             SET name = $1,
                 category = $2,
                 proficiency = $3,
                 updated_at = NOW()
             WHERE id = $4 AND user_id = $5
             RETURNING id, name, category, proficiency, created_at, updated_at`,
            [updatedName, updatedCategory, matchedProficiency, skillId, userId]
        );

        const updated = result.rows[0];

        return res.status(200).json({
            success: true,
            message: "Skill updated successfully",
            skill: {
                ...updated,
                level: updated.proficiency,
            },
        });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "A skill with this name already exists on your profile",
            });
        }

        console.error("Update skill error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update skill",
        });
    }
};

// ======================================================
// DELETE /api/skills/:id
// Delete a skill belonging to the authenticated user
// ======================================================
export const deleteSkill = async (req, res) => {
    try {
        const userId = req.user.id;
        const skillId = req.params.id;

        if (!UUID_REGEX.test(skillId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid skill ID format",
            });
        }

        // Verify existence and ownership
        const existing = await pool.query(
            "SELECT id, user_id FROM skills WHERE id = $1",
            [skillId]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Skill not found",
            });
        }

        if (existing.rows[0].user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: You do not have permission to delete this skill",
            });
        }

        await pool.query(
            "DELETE FROM skills WHERE id = $1 AND user_id = $2",
            [skillId, userId]
        );

        return res.status(200).json({
            success: true,
            message: "Skill deleted successfully",
            id: skillId,
        });
    } catch (error) {
        console.error("Delete skill error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete skill",
        });
    }
};
