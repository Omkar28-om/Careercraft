import pool from "../db.js";
import { calculateProfileCompleteness } from "../utils/profileCompleteness.js";
import { getLevelFromXp } from "../utils/xpLevel.js";

/**
 * Collects actual, verified user data from PostgreSQL for req.user.id.
 * All statistics are computed server-side from PostgreSQL as the source of truth.
 * 
 * Never accepts statistics from frontend request payloads.
 * Never uses sensitive attributes (religion, caste, health, race, tokens, passwords).
 * 
 * @param {string} userId - UUID of the authenticated user
 * @returns {Promise<Object>} Aggregated user profile and platform activity state
 */
export async function collectUserData(userId) {
  // 1. Profile and Core User Record
  const userProfileRes = await pool.query(
    `SELECT 
      u.id, u.name, u.email, u.role,
      p.bio, p.college, p.degree, p.graduation_year,
      p.location, p.phone, p.avatar_url,
      p.github_url, p.linkedin_url, p.portfolio_url
     FROM users u
     LEFT JOIN profiles p ON u.id = p.id
     WHERE u.id = $1`,
    [userId]
  );

  const userRow = userProfileRes.rows[0];
  if (!userRow) {
    throw new Error("User not found");
  }

  // 2. Verified Skills
  const skillsRes = await pool.query(
    `SELECT id, name, category, proficiency, created_at
     FROM skills
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  const skills = skillsRes.rows;

  // Compute profile completeness
  const profileCompleteness = calculateProfileCompleteness(userRow, skills);

  // 3. Coding Activity and Solved Problems
  const solvedProblemsRes = await pool.query(
    `SELECT DISTINCT 
      p.id, p.slug, p.title, p.difficulty, p.category, p.tags
     FROM coding_submissions s
     JOIN coding_problems p ON s.problem_id = p.id
     WHERE s.user_id = $1 AND s.status = 'accepted'`,
    [userId]
  );
  const solvedProblems = solvedProblemsRes.rows;

  const allSubmissionsRes = await pool.query(
    `SELECT 
      COUNT(*)::int as total_submissions,
      COUNT(CASE WHEN status = 'accepted' THEN 1 END)::int as accepted_submissions
     FROM coding_submissions
     WHERE user_id = $1`,
    [userId]
  );
  const submissionStats = allSubmissionsRes.rows[0] || {
    total_submissions: 0,
    accepted_submissions: 0,
  };

  // 4. Courses and Learning Activity
  const enrollmentsRes = await pool.query(
    `SELECT 
      ce.id as enrollment_id,
      ce.course_id,
      ce.progress_percent,
      ce.status,
      ce.enrolled_at,
      ce.completed_at,
      c.title,
      c.slug,
      c.category,
      c.level,
      c.duration_minutes
     FROM course_enrollments ce
     JOIN courses c ON ce.course_id = c.id
     WHERE ce.user_id = $1
     ORDER BY ce.enrolled_at DESC`,
    [userId]
  );
  const courseEnrollments = enrollmentsRes.rows;
  const completedCourses = courseEnrollments.filter((c) => c.status === "completed");

  const lessonCountRes = await pool.query(
    `SELECT COUNT(*)::int as completed_lessons
     FROM course_lesson_progress
     WHERE user_id = $1 AND completed = true`,
    [userId]
  );
  const completedLessonsCount = lessonCountRes.rows[0]?.completed_lessons || 0;

  // 5. Portfolio Projects
  const projectsRes = await pool.query(
    `SELECT 
      id, title, slug, description, project_type, status,
      technologies, github_url, live_url, is_featured, created_at
     FROM projects
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  const projects = projectsRes.rows;
  const completedProjects = projects.filter((p) => p.status === "completed");

  // 6. Student Progress & XP
  const progressRes = await pool.query(
    `SELECT total_xp, current_streak, longest_streak, problems_solved, courses_completed, projects_completed
     FROM student_progress
     WHERE user_id = $1`,
    [userId]
  );
  const progressRow = progressRes.rows[0] || {
    total_xp: 0,
    current_streak: 0,
    longest_streak: 0,
    problems_solved: solvedProblems.length,
    courses_completed: completedCourses.length,
    projects_completed: completedProjects.length,
  };

  const levelInfo = getLevelFromXp(progressRow.total_xp || 0);

  // 7. Achievements
  const achievementsRes = await pool.query(
    `SELECT a.id, a.code, a.title, a.reward_xp, ua.unlocked_at
     FROM user_achievements ua
     JOIN achievements a ON ua.achievement_id = a.id
     WHERE ua.user_id = $1
     ORDER BY ua.unlocked_at DESC`,
    [userId]
  );
  const userAchievements = achievementsRes.rows;

  // 8. Jobs Activity
  const jobApplicationsRes = await pool.query(
    `SELECT 
      ja.id, ja.status, ja.applied_at,
      j.id as job_id, j.title, j.company_name, j.category, j.job_type, j.work_mode
     FROM job_applications ja
     JOIN jobs j ON ja.job_id = j.id
     WHERE ja.user_id = $1
     ORDER BY ja.applied_at DESC`,
    [userId]
  );
  const jobApplications = jobApplicationsRes.rows;

  const savedJobsCountRes = await pool.query(
    `SELECT COUNT(*)::int as count FROM saved_jobs WHERE user_id = $1`,
    [userId]
  );
  const savedJobsCount = savedJobsCountRes.rows[0]?.count || 0;

  // 9. Freelance Activity
  const freelanceProposalsRes = await pool.query(
    `SELECT 
      fp.id, fp.status, fp.proposed_amount, fp.created_at,
      p.id as project_id, p.title, p.category, p.skills
     FROM freelance_proposals fp
     JOIN freelance_projects p ON fp.project_id = p.id
     WHERE fp.freelancer_id = $1
     ORDER BY fp.created_at DESC`,
    [userId]
  );
  const freelanceProposals = freelanceProposalsRes.rows;

  const freelanceContractsRes = await pool.query(
    `SELECT 
      fc.id, fc.status, fc.agreed_amount, fc.currency, fc.started_at, fc.completed_at,
      p.category, p.title
     FROM freelance_contracts fc
     JOIN freelance_projects p ON fc.project_id = p.id
     WHERE fc.freelancer_id = $1
     ORDER BY fc.created_at DESC`,
    [userId]
  );
  const freelanceContracts = freelanceContractsRes.rows;
  const completedContracts = freelanceContracts.filter((c) => c.status === "completed");

  // 10. User Career Preferences
  const preferencesRes = await pool.query(
    `SELECT target_roles, preferred_domains, preferred_work_mode, experience_goal
     FROM career_preferences
     WHERE user_id = $1`,
    [userId]
  );
  const preferences = preferencesRes.rows[0] || {
    target_roles: [],
    preferred_domains: [],
    preferred_work_mode: "flexible",
    experience_goal: "entry_level",
  };

  return {
    user: {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      role: userRow.role,
    },
    profile: {
      bio: userRow.bio || "",
      college: userRow.college || "",
      degree: userRow.degree || "",
      graduation_year: userRow.graduation_year || null,
      location: userRow.location || "",
      phone: userRow.phone || "",
      avatar_url: userRow.avatar_url || "",
      github_url: userRow.github_url || "",
      linkedin_url: userRow.linkedin_url || "",
      portfolio_url: userRow.portfolio_url || "",
      completeness: profileCompleteness,
    },
    skills,
    coding: {
      solvedProblems,
      solvedCount: solvedProblems.length,
      totalSubmissions: submissionStats.total_submissions,
      acceptedSubmissions: submissionStats.accepted_submissions,
    },
    courses: {
      enrollments: courseEnrollments,
      completedCourses,
      completedCount: completedCourses.length,
      completedLessonsCount,
    },
    projects: {
      list: projects,
      count: projects.length,
      completedProjects,
      completedCount: completedProjects.length,
    },
    achievements: {
      list: userAchievements,
      count: userAchievements.length,
      totalXp: progressRow.total_xp || 0,
      level: levelInfo.level,
      levelTitle: levelInfo.title,
    },
    jobs: {
      applications: jobApplications,
      applicationsCount: jobApplications.length,
      savedJobsCount,
    },
    freelance: {
      proposals: freelanceProposals,
      proposalsCount: freelanceProposals.length,
      contracts: freelanceContracts,
      contractsCount: freelanceContracts.length,
      completedContracts,
      completedCount: completedContracts.length,
    },
    preferences,
  };
}
