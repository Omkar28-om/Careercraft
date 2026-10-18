/**
 * Centralized CareerCraft Profile Completeness Calculator
 * 
 * Computes deterministic profile completeness from actual database fields.
 * 
 * Required Profile Fields (9):
 * - bio
 * - phone
 * - location
 * - college
 * - degree
 * - graduation_year
 * - github_url
 * - linkedin_url
 * - portfolio_url
 * 
 * Skills Section (1):
 * - 0 skills = not complete (0)
 * - 1+ skills = complete (1)
 * 
 * Total Fields = 10
 */

const REQUIRED_PROFILE_FIELDS = [
    "bio",
    "phone",
    "location",
    "college",
    "degree",
    "graduation_year",
    "github_url",
    "linkedin_url",
    "portfolio_url",
];

export function calculateProfileCompleteness(profile = {}, skills = []) {
    let completedFields = 0;
    const safeProfile = profile || {};

    // 1. Check each required profile field
    for (const field of REQUIRED_PROFILE_FIELDS) {
        const val = safeProfile[field];
        if (val !== null && val !== undefined) {
            if (typeof val === "string") {
                if (val.trim().length > 0) {
                    completedFields++;
                }
            } else if (typeof val === "number") {
                if (!isNaN(val) && val > 0) {
                    completedFields++;
                }
            }
        }
    }

    // 2. Check skills contribution
    let skillCount = 0;
    if (Array.isArray(skills)) {
        skillCount = skills.length;
    } else if (typeof skills === "number") {
        skillCount = Math.max(0, parseInt(skills, 10) || 0);
    }

    const hasSkills = skillCount > 0;
    if (hasSkills) {
        completedFields++;
    }

    const totalFields = REQUIRED_PROFILE_FIELDS.length + 1; // 9 + 1 = 10
    const rawPercent = (completedFields / totalFields) * 100;
    const percentage = Math.min(100, Math.max(0, Math.round(rawPercent)));

    return {
        percentage,
        completedFields,
        totalFields,
        hasSkills,
        skillCount,
    };
}

export default calculateProfileCompleteness;
