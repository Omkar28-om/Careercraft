import pool from "../db.js";
import { recordActivity } from "./activity.controller.js";
import { evaluateAchievements } from "../services/achievement.service.js";
import { checkProfileMilestone } from "../services/notification.service.js";

export const ALLOWED_CAREER_DOMAINS = [
    "Full Stack Development",
    "AI & Machine Learning",
    "Data Science & Analytics",
    "Java Development",
    "Python Development",
    "UI/UX & Product Design",
    "Cybersecurity",
    "Digital Marketing",
];

export const normalizeCareerDomain = (domain) => {
    if (!domain) return null;
    const trimmed = String(domain).trim().toLowerCase();
    const match = ALLOWED_CAREER_DOMAINS.find((d) => d.toLowerCase() === trimmed);
    return match || null;
};

// ======================================================
// GET /api/profile
// Query authenticated user's profile from PostgreSQL
// ======================================================
export const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        // Query users joined with profiles table
        const result = await pool.query(
            `SELECT 
                u.id,
                u.name,
                u.email,
                u.role,
                p.bio,
                p.phone,
                p.location,
                p.college,
                p.degree,
                p.graduation_year,
                p.avatar_url,
                p.github_url,
                p.linkedin_url,
                p.portfolio_url,
                p.career_domain,
                p.created_at AS profile_created_at,
                p.updated_at AS profile_updated_at
             FROM users u
             LEFT JOIN profiles p ON u.id = p.id
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

        // Format clean profile response without exposing any sensitive hashes
        const profile = {
            id: row.id,
            name: row.name,
            email: row.email,
            role: row.role,
            bio: row.bio || null,
            phone: row.phone || null,
            location: row.location || null,
            college: row.college || null,
            degree: row.degree || null,
            graduation_year: row.graduation_year || null,
            avatar_url: row.avatar_url || null,
            github_url: row.github_url || null,
            linkedin_url: row.linkedin_url || null,
            portfolio_url: row.portfolio_url || null,
            career_domain: row.career_domain || null,
            created_at: row.profile_created_at || null,
            updated_at: row.profile_updated_at || null,
        };

        return res.status(200).json({
            success: true,
            profile,
        });
    } catch (error) {
        console.error("Get profile error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve profile",
        });
    }
};

// ======================================================
// PUT /api/profile
// Update authenticated user's profile with parameterized SQL
// ======================================================
export const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            bio,
            phone,
            location,
            college,
            degree,
            graduation_year,
            avatar_url,
            github_url,
            linkedin_url,
            portfolio_url,
            career_domain,
        } = req.body;

        // Fetch existing profile to preserve any unprovided fields
        const existing = await pool.query("SELECT * FROM profiles WHERE id = $1", [userId]);
        const current = existing.rows[0] || {};

        let updatedCareerDomain = current.career_domain ?? null;
        if (career_domain !== undefined) {
            if (career_domain === null || career_domain === "") {
                updatedCareerDomain = null;
            } else {
                const normalized = normalizeCareerDomain(career_domain);
                if (!normalized) {
                    return res.status(400).json({
                        success: false,
                        message: `Invalid career domain. Allowed values: ${ALLOWED_CAREER_DOMAINS.join(", ")}`,
                    });
                }
                updatedCareerDomain = normalized;
            }
        }

        const cleanString = (val, maxLen) => {
            if (val === undefined) return undefined;
            if (val === null || val === "") return null;
            const str = String(val).trim();
            return maxLen ? str.slice(0, maxLen) : str;
        };

        const updatedBio = cleanString(bio) !== undefined ? cleanString(bio) : (current.bio ?? null);
        const updatedPhone = cleanString(phone, 20) !== undefined ? cleanString(phone, 20) : (current.phone ?? null);
        const updatedLocation = cleanString(location, 100) !== undefined ? cleanString(location, 100) : (current.location ?? null);
        const updatedCollege = cleanString(college, 150) !== undefined ? cleanString(college, 150) : (current.college ?? null);
        const updatedDegree = cleanString(degree, 100) !== undefined ? cleanString(degree, 100) : (current.degree ?? null);

        let updatedGradYear = current.graduation_year ?? null;
        if (graduation_year !== undefined) {
            if (graduation_year === null || graduation_year === "") {
                updatedGradYear = null;
            } else {
                const parsed = parseInt(graduation_year, 10);
                updatedGradYear = isNaN(parsed) ? null : parsed;
            }
        }

        const updatedAvatar = cleanString(avatar_url) !== undefined ? cleanString(avatar_url) : (current.avatar_url ?? null);
        const updatedGithub = cleanString(github_url) !== undefined ? cleanString(github_url) : (current.github_url ?? null);
        const updatedLinkedin = cleanString(linkedin_url) !== undefined ? cleanString(linkedin_url) : (current.linkedin_url ?? null);
        const updatedPortfolio = cleanString(portfolio_url) !== undefined ? cleanString(portfolio_url) : (current.portfolio_url ?? null);

        // Parameterized upsert into profiles table
        const result = await pool.query(
            `INSERT INTO profiles (
                id, bio, phone, location, college, degree, graduation_year, avatar_url, github_url, linkedin_url, portfolio_url, career_domain, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
            ON CONFLICT (id) DO UPDATE SET
                bio = EXCLUDED.bio,
                phone = EXCLUDED.phone,
                location = EXCLUDED.location,
                college = EXCLUDED.college,
                degree = EXCLUDED.degree,
                graduation_year = EXCLUDED.graduation_year,
                avatar_url = EXCLUDED.avatar_url,
                github_url = EXCLUDED.github_url,
                linkedin_url = EXCLUDED.linkedin_url,
                portfolio_url = EXCLUDED.portfolio_url,
                career_domain = EXCLUDED.career_domain,
                updated_at = NOW()
            RETURNING *`,
            [
                userId,
                updatedBio,
                updatedPhone,
                updatedLocation,
                updatedCollege,
                updatedDegree,
                updatedGradYear,
                updatedAvatar,
                updatedGithub,
                updatedLinkedin,
                updatedPortfolio,
                updatedCareerDomain,
            ]
        );

        const saved = result.rows[0];

        // Trusted activity generation: profile_update with 0 XP
        try {
            await recordActivity({
                userId,
                activityType: "profile_update",
                title: "Updated profile",
                description: updatedCareerDomain
                    ? `Updated profile with ${updatedCareerDomain} domain`
                    : "Updated personal profile information",
                xpEarned: 0,
                metadata: {
                    college: updatedCollege || null,
                    degree: updatedDegree || null,
                    career_domain: updatedCareerDomain || null,
                },
            });
        } catch (actErr) {
            console.error("Failed to record profile update activity:", actErr);
        }

        // Evaluate achievements (e.g. PROFILE_COMPLETE)
        try {
            await evaluateAchievements(userId);
            await checkProfileMilestone({ userId });
        } catch (achErr) {
            console.error("Failed to evaluate achievements after profile update:", achErr);
        }

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            profile: {
                id: userId,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role,
                bio: saved.bio,
                phone: saved.phone,
                location: saved.location,
                college: saved.college,
                degree: saved.degree,
                graduation_year: saved.graduation_year,
                avatar_url: saved.avatar_url,
                github_url: saved.github_url,
                linkedin_url: saved.linkedin_url,
                portfolio_url: saved.portfolio_url,
                career_domain: saved.career_domain,
                created_at: saved.created_at,
                updated_at: saved.updated_at,
            },
        });
    } catch (error) {
        console.error("Update profile error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update profile",
        });
    }
};

// ======================================================
// PUT /api/profile/domain
// Specialized endpoint to set/change student's career domain
// ======================================================
export const updateCareerDomain = async (req, res) => {
    try {
        const userId = req.user.id;
        const { domain } = req.body;

        if (!domain) {
            return res.status(400).json({
                success: false,
                message: "Career domain is required",
            });
        }

        const validDomain = normalizeCareerDomain(domain);
        if (!validDomain) {
            return res.status(400).json({
                success: false,
                message: `Invalid domain. Must be one of: ${ALLOWED_CAREER_DOMAINS.join(", ")}`,
            });
        }

        const result = await pool.query(
            `INSERT INTO profiles (id, career_domain, updated_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (id) DO UPDATE SET
                 career_domain = EXCLUDED.career_domain,
                 updated_at = NOW()
             RETURNING career_domain`,
            [userId, validDomain]
        );

        try {
            await recordActivity({
                userId,
                activityType: "profile_update",
                title: "Selected career domain",
                description: `Selected ${validDomain} as target career domain`,
                xpEarned: 10,
                metadata: { career_domain: validDomain },
            });
        } catch {}

        return res.status(200).json({
            success: true,
            message: "Career domain updated successfully",
            career_domain: result.rows[0].career_domain,
        });
    } catch (error) {
        console.error("Update career domain error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update career domain",
        });
    }
};
