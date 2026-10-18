import pool from "../db.js";
import { collectUserData } from "../services/careerRecommendation.service.js";
import {
  ENGINE_VERSION,
  calculateOverallCareerReadiness,
  evaluatePathway,
  generatePersonalizedActionPlan,
} from "../services/careerScoring.service.js";
import { createNotification } from "../services/notification.service.js";
import { generateCareerExplanation } from "../services/aiCareerProvider.service.js";

const COOLDOWN_SECONDS = 300; // 5 minutes

const ALLOWED_WORK_MODES = new Set(["remote", "hybrid", "onsite", "flexible"]);
const ALLOWED_EXPERIENCE_GOALS = new Set([
  "internship",
  "entry_level",
  "mid_level",
  "freelance",
  "transition",
]);

/**
 * Helper to compute full recommendation bundle for a user.
 */
async function computeUserRecommendations(userId) {
  const userData = await collectUserData(userId);

  // Fetch published courses, problems, career paths, and active jobs for real-data linking
  const [coursesRes, problemsRes, pathsRes, jobsRes] = await Promise.all([
    pool.query(
      `SELECT id, slug, title, category, level, duration_minutes, short_description 
       FROM courses 
       WHERE is_published = true 
       ORDER BY title ASC`
    ),
    pool.query(
      `SELECT id, slug, title, difficulty, category, tags 
       FROM coding_problems 
       WHERE is_published = true 
       ORDER BY title ASC`
    ),
    pool.query(
      `SELECT id, slug, name, description, category, level, icon, 
              required_skills, recommended_skills, related_courses, 
              related_projects, related_coding_categories, is_active
       FROM career_paths 
       WHERE is_active = true 
       ORDER BY name ASC`
    ),
    pool.query(
      `SELECT id, title, company_name, location, work_mode, job_type, salary_min, salary_max, salary_currency, skills, category, experience_level
       FROM jobs 
       WHERE is_active = true 
       ORDER BY created_at DESC`
    ),
  ]);

  const dbCourses = coursesRes.rows;
  const dbProblems = problemsRes.rows;
  const careerPaths = pathsRes.rows;
  const dbJobs = jobsRes.rows;

  // 1. Calculate overall career readiness
  const careerReadiness = calculateOverallCareerReadiness(userData);

  // 2. Evaluate all active career paths deterministically
  const evaluatedPaths = careerPaths.map((path) =>
    evaluatePathway(path, userData, dbCourses, dbProblems, dbJobs)
  );

  // Sort paths by score descending (stable secondary sort by name)
  evaluatedPaths.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.name.localeCompare(b.name);
  });

  // Attach explanation to evaluated paths
  await Promise.all(
    evaluatedPaths.slice(0, 3).map(async (path) => {
      try {
        const aiRes = await generateCareerExplanation({
          careerName: path.name,
          score: path.score,
          matchedSkills: path.matched_skills,
          missingSkills: path.missing_skills,
          evidence: path.evidence,
        });
        path.explanation = aiRes.explanation;
        path.explanationSource = aiRes.source;
      } catch {
        path.explanation = null;
        path.explanationSource = "deterministic";
      }
    })
  );

  const topPath = evaluatedPaths[0] || null;

  // 3. Generate personalized action plan
  const nextSteps = topPath
    ? generatePersonalizedActionPlan(topPath, userData, dbCourses)
    : [];

  // 4. Summarize evidence and gaps
  const evidenceMap = {};
  const skillGapsMap = {};

  for (const path of evaluatedPaths) {
    evidenceMap[path.slug] = path.evidence;
    skillGapsMap[path.slug] = path.skill_gaps;
  }

  // 5. Data Summary (sanitized snapshot of user state at generation time)
  const dataSummary = {
    skillsCount: (userData.skills || []).length,
    problemsSolved: userData.coding?.solvedCount || 0,
    coursesCompleted: userData.courses?.completedCount || 0,
    projectsCompleted: userData.projects?.completedCount || 0,
    profileCompleteness: userData.profile?.completeness?.percentage || 0,
    applicationsCount: userData.jobs?.applicationsCount || 0,
    proposalsCount: userData.freelance?.proposalsCount || 0,
    contractsCount: userData.freelance?.contractsCount || 0,
  };

  return {
    careerReadiness,
    topRecommendations: evaluatedPaths,
    skillGaps: skillGapsMap,
    nextSteps,
    evidence: evidenceMap,
    dataSummary,
    userData,
  };
}

/**
 * GET /api/career/profile
 * Retrieves candidate's career profile, verified skills, preferences, and current readiness.
 */
export async function getCareerProfile(req, res) {
  try {
    const userId = req.user.id;
    const userData = await collectUserData(userId);
    const readiness = calculateOverallCareerReadiness(userData);

    // Retrieve latest snapshot if exists
    const snapshotRes = await pool.query(
      `SELECT id, generated_at, career_readiness, top_recommendations, created_at
       FROM career_recommendation_snapshots
       WHERE user_id = $1
       ORDER BY generated_at DESC
       LIMIT 1`,
      [userId]
    );

    const latestSnapshot = snapshotRes.rows[0] || null;

    res.status(200).json({
      success: true,
      careerProfile: {
        user: {
          id: userData.user.id,
          name: userData.user.name,
          email: userData.user.email,
        },
        profile: userData.profile,
        skills: userData.skills,
        preferences: userData.preferences,
        readiness,
        latestSnapshot: latestSnapshot
          ? {
              id: latestSnapshot.id,
              generatedAt: latestSnapshot.generated_at,
              readiness: Number(latestSnapshot.career_readiness),
              topCareer: latestSnapshot.top_recommendations?.[0]?.name || null,
            }
          : null,
      },
    });
  } catch (err) {
    console.error("Error in getCareerProfile:", err);
    res.status(500).json({
      success: false,
      message: "Failed to load career profile",
    });
  }
}

/**
 * GET /api/career/recommendations
 * Returns current career recommendations snapshot, generating one if not yet present.
 */
export async function getCareerRecommendations(req, res) {
  try {
    const userId = req.user.id;

    // Check for existing snapshot
    const snapshotRes = await pool.query(
      `SELECT id, generated_at, engine_version, career_readiness,
              top_recommendations, skill_gaps, next_steps, evidence, data_summary
       FROM career_recommendation_snapshots
       WHERE user_id = $1
       ORDER BY generated_at DESC
       LIMIT 1`,
      [userId]
    );

    let snapshot = snapshotRes.rows[0];

    // If no snapshot exists yet, generate initial baseline snapshot
    if (!snapshot) {
      const computed = await computeUserRecommendations(userId);

      const insertRes = await pool.query(
        `INSERT INTO career_recommendation_snapshots (
          user_id, generated_at, engine_version, career_readiness,
          top_recommendations, skill_gaps, next_steps, evidence, data_summary
        )
        VALUES ($1, NOW(), $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, generated_at, engine_version, career_readiness,
                  top_recommendations, skill_gaps, next_steps, evidence, data_summary`,
        [
          userId,
          ENGINE_VERSION,
          computed.careerReadiness.percentage,
          JSON.stringify(computed.topRecommendations),
          JSON.stringify(computed.skillGaps),
          JSON.stringify(computed.nextSteps),
          JSON.stringify(computed.evidence),
          JSON.stringify(computed.dataSummary),
        ]
      );

      snapshot = insertRes.rows[0];
    }

    // Also get current user preferences and overall profile completeness
    const prefRes = await pool.query(
      `SELECT target_roles, preferred_domains, preferred_work_mode, experience_goal
       FROM career_preferences
       WHERE user_id = $1`,
      [userId]
    );

    const preferences = prefRes.rows[0] || {
      target_roles: [],
      preferred_domains: [],
      preferred_work_mode: "flexible",
      experience_goal: "entry_level",
    };

    res.status(200).json({
      success: true,
      recommendation: {
        id: snapshot.id,
        generatedAt: snapshot.generated_at,
        engineVersion: snapshot.engine_version,
        careerReadiness: {
          percentage: Number(snapshot.career_readiness),
          label: (snapshot.top_recommendations?.[0]?.readinessLabel) || (Number(snapshot.career_readiness) >= 75 ? "Career Ready" : Number(snapshot.career_readiness) >= 50 ? "Developing Skills" : Number(snapshot.career_readiness) >= 25 ? "Building Foundations" : "Getting Started"),
          breakdown: snapshot.data_summary || {},
        },
        topRecommendations: snapshot.top_recommendations || [],
        skillGaps: snapshot.skill_gaps || {},
        nextSteps: snapshot.next_steps || [],
        evidence: snapshot.evidence || {},
        dataSummary: snapshot.data_summary || {},
        preferences,
      },
    });
  } catch (err) {
    console.error("Error in getCareerRecommendations:", err);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve career recommendations",
    });
  }
}

/**
 * POST /api/career/recommendations/regenerate
 * Regenerates recommendation snapshot with strict 5-minute server-side cooldown.
 */
export async function regenerateCareerRecommendations(req, res) {
  try {
    const userId = req.user.id;

    // Check last snapshot timestamp for cooldown
    const latestRes = await pool.query(
      `SELECT id, generated_at, career_readiness, top_recommendations
       FROM career_recommendation_snapshots
       WHERE user_id = $1
       ORDER BY generated_at DESC
       LIMIT 1`,
      [userId]
    );

    const lastSnapshot = latestRes.rows[0];

    if (lastSnapshot) {
      const now = new Date().getTime();
      const lastGenerated = new Date(lastSnapshot.generated_at).getTime();
      const elapsedSeconds = Math.floor((now - lastGenerated) / 1000);

      if (elapsedSeconds < COOLDOWN_SECONDS) {
        const retryAfterSeconds = COOLDOWN_SECONDS - elapsedSeconds;
        return res.status(429).json({
          success: false,
          message: `Regeneration cooldown active. Please wait ${retryAfterSeconds} seconds before requesting a new snapshot.`,
          retryAfterSeconds,
        });
      }
    }

    // Compute fresh recommendations from PostgreSQL source of truth
    const computed = await computeUserRecommendations(userId);

    const insertRes = await pool.query(
      `INSERT INTO career_recommendation_snapshots (
        user_id, generated_at, engine_version, career_readiness,
        top_recommendations, skill_gaps, next_steps, evidence, data_summary
      )
      VALUES ($1, NOW(), $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, generated_at, engine_version, career_readiness,
                top_recommendations, skill_gaps, next_steps, evidence, data_summary`,
      [
        userId,
        ENGINE_VERSION,
        computed.careerReadiness.percentage,
        JSON.stringify(computed.topRecommendations),
        JSON.stringify(computed.skillGaps),
        JSON.stringify(computed.nextSteps),
        JSON.stringify(computed.evidence),
        JSON.stringify(computed.dataSummary),
      ]
    );

    const newSnapshot = insertRes.rows[0];

    // Notification check: Trigger notification only if material change occurred
    if (lastSnapshot) {
      const prevTop = lastSnapshot.top_recommendations?.[0]?.slug;
      const newTop = computed.topRecommendations?.[0]?.slug;
      const prevScore = Number(lastSnapshot.career_readiness) || 0;
      const newScore = computed.careerReadiness.percentage;
      const scoreDiff = Math.abs(newScore - prevScore);

      const hasMaterialChange = prevTop !== newTop || scoreDiff >= 5;

      if (hasMaterialChange) {
        try {
          await createNotification({
            userId,
            type: "career_recommendation",
            title: "Career Roadmap Updated",
            message: `Your career analysis has been refreshed. Overall readiness is at ${newScore}%, with top pathway: ${computed.topRecommendations?.[0]?.name}.`,
            link: "/career",
            eventKey: `career_update_${newSnapshot.id}`,
            metadata: {
              snapshotId: newSnapshot.id,
              readiness: newScore,
              topPath: computed.topRecommendations?.[0]?.name,
            },
          });
        } catch (notifErr) {
          console.warn("Could not create career update notification:", notifErr.message);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: "Career recommendations regenerated successfully",
      recommendation: {
        id: newSnapshot.id,
        generatedAt: newSnapshot.generated_at,
        engineVersion: newSnapshot.engine_version,
        careerReadiness: computed.careerReadiness,
        topRecommendations: newSnapshot.top_recommendations || [],
        skillGaps: newSnapshot.skill_gaps || {},
        nextSteps: newSnapshot.next_steps || [],
        evidence: newSnapshot.evidence || {},
        dataSummary: newSnapshot.data_summary || {},
      },
    });
  } catch (err) {
    console.error("Error in regenerateCareerRecommendations:", err);
    res.status(500).json({
      success: false,
      message: "Failed to regenerate career recommendations",
    });
  }
}

/**
 * GET /api/career/history
 * Returns historical recommendation snapshots belonging strictly to the authenticated user.
 */
export async function getCareerHistory(req, res) {
  try {
    const userId = req.user.id;

    const historyRes = await pool.query(
      `SELECT id, generated_at, engine_version, career_readiness,
              top_recommendations->0 as top_career,
              jsonb_array_length(top_recommendations) as pathways_evaluated_count,
              created_at
       FROM career_recommendation_snapshots
       WHERE user_id = $1
       ORDER BY generated_at DESC
       LIMIT 30`,
      [userId]
    );

    const history = historyRes.rows.map((row) => ({
      id: row.id,
      generatedAt: row.generated_at,
      engineVersion: row.engine_version,
      careerReadiness: Number(row.career_readiness),
      topPathway: row.top_career
        ? {
            slug: row.top_career.slug,
            name: row.top_career.name,
            score: row.top_career.score,
            category: row.top_career.category,
          }
        : null,
      evaluatedCount: Number(row.pathways_evaluated_count) || 0,
      createdAt: row.created_at,
    }));

    res.status(200).json({
      success: true,
      history,
    });
  } catch (err) {
    console.error("Error in getCareerHistory:", err);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve career history",
    });
  }
}

/**
 * PATCH /api/career/preferences
 * Updates authenticated user's target career roles, domains, and work preferences.
 */
export async function updateCareerPreferences(req, res) {
  try {
    const userId = req.user.id;
    const target_roles = req.body.target_roles !== undefined ? req.body.target_roles : req.body.targetRoles;
    const preferred_domains = req.body.preferred_domains !== undefined ? req.body.preferred_domains : req.body.preferredDomains;
    const preferred_work_mode = req.body.preferred_work_mode !== undefined ? req.body.preferred_work_mode : req.body.preferredWorkMode;
    const experience_goal = req.body.experience_goal !== undefined ? req.body.experience_goal : req.body.experienceGoal;

    // Validation: target_roles must be array of strings
    if (target_roles !== undefined) {
      if (!Array.isArray(target_roles)) {
        return res.status(400).json({
          success: false,
          message: "target_roles must be an array of role strings",
        });
      }
      for (const role of target_roles) {
        if (typeof role !== "string" || role.trim().length === 0) {
          return res.status(400).json({
            success: false,
            message: "Each target role must be a non-empty string",
          });
        }
      }
    }

    // Validation: preferred_domains must be array of strings
    if (preferred_domains !== undefined) {
      if (!Array.isArray(preferred_domains)) {
        return res.status(400).json({
          success: false,
          message: "preferred_domains must be an array of domain strings",
        });
      }
      for (const d of preferred_domains) {
        if (typeof d !== "string" || d.trim().length === 0) {
          return res.status(400).json({
            success: false,
            message: "Each preferred domain must be a non-empty string",
          });
        }
      }
    }

    // Validation: preferred_work_mode
    if (preferred_work_mode !== undefined && !ALLOWED_WORK_MODES.has(preferred_work_mode)) {
      return res.status(400).json({
        success: false,
        message: `Invalid work mode. Allowed values: ${Array.from(ALLOWED_WORK_MODES).join(", ")}`,
      });
    }

    // Validation: experience_goal
    if (experience_goal !== undefined && !ALLOWED_EXPERIENCE_GOALS.has(experience_goal)) {
      return res.status(400).json({
        success: false,
        message: `Invalid experience goal. Allowed values: ${Array.from(ALLOWED_EXPERIENCE_GOALS).join(", ")}`,
      });
    }

    // Existing preferences check or default
    const existingRes = await pool.query(
      `SELECT target_roles, preferred_domains, preferred_work_mode, experience_goal
       FROM career_preferences
       WHERE user_id = $1`,
      [userId]
    );

    const current = existingRes.rows[0] || {
      target_roles: [],
      preferred_domains: [],
      preferred_work_mode: "flexible",
      experience_goal: "entry_level",
    };

    const finalTargetRoles = target_roles !== undefined ? target_roles : current.target_roles;
    const finalDomains = preferred_domains !== undefined ? preferred_domains : current.preferred_domains;
    const finalWorkMode = preferred_work_mode !== undefined ? preferred_work_mode : current.preferred_work_mode;
    const finalExpGoal = experience_goal !== undefined ? experience_goal : current.experience_goal;

    const upsertRes = await pool.query(
      `INSERT INTO career_preferences (
        user_id, target_roles, preferred_domains, preferred_work_mode, experience_goal, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        target_roles = EXCLUDED.target_roles,
        preferred_domains = EXCLUDED.preferred_domains,
        preferred_work_mode = EXCLUDED.preferred_work_mode,
        experience_goal = EXCLUDED.experience_goal,
        updated_at = NOW()
      RETURNING id, user_id, target_roles, preferred_domains, preferred_work_mode, experience_goal, updated_at`,
      [
        userId,
        JSON.stringify(finalTargetRoles),
        JSON.stringify(finalDomains),
        finalWorkMode,
        finalExpGoal,
      ]
    );

    res.status(200).json({
      success: true,
      message: "Career preferences updated successfully",
      preferences: upsertRes.rows[0],
    });
  } catch (err) {
    console.error("Error in updateCareerPreferences:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update career preferences",
    });
  }
}

/**
 * GET /api/career/paths
 * Returns all active career paths catalog.
 */
export async function getCareerPaths(req, res) {
  try {
    const pathsRes = await pool.query(
      `SELECT id, slug, name, description, category, level, icon,
              required_skills, recommended_skills, related_courses,
              related_projects, related_coding_categories, is_active
       FROM career_paths
       WHERE is_active = true
       ORDER BY name ASC`
    );

    res.status(200).json({
      success: true,
      paths: pathsRes.rows,
    });
  } catch (err) {
    console.error("Error in getCareerPaths:", err);
    res.status(500).json({
      success: false,
      message: "Failed to load career paths catalog",
    });
  }
}

/**
 * GET /api/career/paths/:slug
 * Returns a specific career path definition by slug.
 */
export async function getCareerPathDetail(req, res) {
  try {
    const { slug } = req.params;

    const pathRes = await pool.query(
      `SELECT id, slug, name, description, category, level, icon,
              required_skills, recommended_skills, related_courses,
              related_projects, related_coding_categories, is_active
       FROM career_paths
       WHERE slug = $1 AND is_active = true`,
      [slug]
    );

    if (pathRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Career path not found",
      });
    }

    res.status(200).json({
      success: true,
      path: pathRes.rows[0],
    });
  } catch (err) {
    console.error("Error in getCareerPathDetail:", err);
    res.status(500).json({
      success: false,
      message: "Failed to load career path details",
    });
  }
}
