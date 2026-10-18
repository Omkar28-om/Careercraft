import {
  normalizeSkillName,
  skillsMatch,
  getProficiencyWeight,
} from "../utils/skillNormalization.js";

/**
 * CareerCraft Deterministic Career Scoring & Skill Gap Engine
 * 
 * Engine Version: 1.0.0
 * 
 * Documented Component Weights:
 * - Skills:        35%
 * - Projects:      20%
 * - Courses:       15%
 * - Coding:        15%
 * - Experience:    10%
 * - Preferences:    5%
 * Total:          100%
 * 
 * Determinism Guarantee:
 * Same database state + same engine version = exactly identical scores and explanations.
 * Zero random numbers.
 */
export const ENGINE_VERSION = "1.0.0";

export const SCORING_WEIGHTS = {
  skills: 0.35,
  projects: 0.20,
  courses: 0.15,
  coding: 0.15,
  experience: 0.10,
  preferences: 0.05,
};

/**
 * Returns platform readiness label from percentage.
 * 
 * 0–24: Getting Started
 * 25–49: Building Foundations
 * 50–74: Developing Skills
 * 75–100: Career Ready
 * 
 * NOTE: These are platform progress labels, NOT employment predictions.
 */
export function getReadinessLabel(percentage) {
  if (percentage >= 75) return "Career Ready";
  if (percentage >= 50) return "Developing Skills";
  if (percentage >= 25) return "Building Foundations";
  return "Getting Started";
}

/**
 * Computes overall platform career readiness score and dimension breakdown.
 * 
 * @param {Object} userData - Collected user data
 * @returns {Object} { percentage, label, breakdown }
 */
export function calculateOverallCareerReadiness(userData) {
  const profileCompleteness = userData.profile?.completeness?.percentage || 0;
  const skillsCount = (userData.skills || []).length;
  const problemsSolved = userData.coding?.solvedCount || 0;
  const coursesCompleted = userData.courses?.completedCount || 0;
  const projectsCompleted = userData.projects?.completedCount || 0;
  
  const appsCount = userData.jobs?.applicationsCount || 0;
  const proposalsCount = userData.freelance?.proposalsCount || 0;
  const contractsCount = userData.freelance?.contractsCount || 0;
  const experienceSignals = appsCount + proposalsCount + contractsCount;

  // Dimension scores (0 - 100)
  const profileScore = Math.min(100, Math.max(0, profileCompleteness));
  const skillScore = Math.min(100, Math.round((skillsCount / 6) * 100));
  const codingScore = Math.min(100, Math.round((problemsSolved / 15) * 100));
  const courseScore = Math.min(100, Math.round((coursesCompleted / 2) * 100));
  const projectScore = Math.min(100, Math.round((projectsCompleted / 2) * 100));
  const experienceScore = Math.min(100, Math.round((experienceSignals / 4) * 100));

  // Balanced overall platform readiness formula:
  // Profile: 15%, Skills: 20%, Coding: 20%, Courses: 20%, Projects: 15%, Experience: 10%
  const total = Math.round(
    profileScore * 0.15 +
    skillScore * 0.20 +
    codingScore * 0.20 +
    courseScore * 0.20 +
    projectScore * 0.15 +
    experienceScore * 0.10
  );

  const percentage = Math.min(100, Math.max(0, total));

  return {
    percentage,
    label: getReadinessLabel(percentage),
    breakdown: {
      profile: profileScore,
      skills: skillScore,
      coding: codingScore,
      courses: courseScore,
      projects: projectScore,
      experience: experienceScore,
    },
  };
}

/**
 * Evaluates a single career path against actual user competencies.
 * 
 * @param {Object} path - Career path record from career_paths
 * @param {Object} userData - Aggregated user data
 * @param {Array<Object>} dbCourses - All published courses in DB
 * @param {Array<Object>} dbProblems - Published coding problems in DB
 * @returns {Object} Comprehensive pathway evaluation
 */
export function evaluatePathway(path, userData, dbCourses = [], dbProblems = [], dbJobs = []) {
  const userSkills = userData.skills || [];
  const requiredSkills = Array.isArray(path.required_skills) ? path.required_skills : [];
  const recommendedSkills = Array.isArray(path.recommended_skills) ? path.recommended_skills : [];
  const relatedCourses = Array.isArray(path.related_courses) ? path.related_courses : [];
  const relatedCodingCats = Array.isArray(path.related_coding_categories) ? path.related_coding_categories : [];

  // ==========================================
  // 1. SKILL MATCHING & GAP DETECTION
  // ==========================================
  const skillGaps = [];
  const matchedSkills = [];
  const partialSkills = [];
  const missingSkills = [];
  let totalSkillWeight = 0;

  for (const reqSkill of requiredSkills) {
    const matchedUserSkill = userSkills.find((s) => skillsMatch(s.name, reqSkill));

    if (matchedUserSkill) {
      const proficiencyWeight = getProficiencyWeight(matchedUserSkill.proficiency);
      totalSkillWeight += proficiencyWeight;

      if (proficiencyWeight >= 80) {
        matchedSkills.push(reqSkill);
        skillGaps.push({
          skill: reqSkill,
          userSkillName: matchedUserSkill.name,
          status: "strong",
          importance: "high",
          proficiency: proficiencyWeight,
          reason: `Strong verified proficiency (${matchedUserSkill.proficiency}) matching core requirements.`,
        });
      } else {
        partialSkills.push(reqSkill);
        skillGaps.push({
          skill: reqSkill,
          userSkillName: matchedUserSkill.name,
          status: "partial",
          importance: "high",
          proficiency: proficiencyWeight,
          reason: `Developing skill (${matchedUserSkill.proficiency}). Advancing to advanced/expert will increase role readiness.`,
        });
      }
    } else {
      missingSkills.push(reqSkill);
      skillGaps.push({
        skill: reqSkill,
        userSkillName: null,
        status: "missing",
        importance: "high",
        proficiency: 0,
        reason: "Required skill for this career pathway.",
      });
    }
  }

  // Base skill match score
  let baseSkillScore = requiredSkills.length > 0
    ? Math.round(totalSkillWeight / requiredSkills.length)
    : 0;

  // Bonus for recommended skills (up to 10 points)
  let recMatchedCount = 0;
  for (const recSkill of recommendedSkills) {
    if (userSkills.some((s) => skillsMatch(s.name, recSkill))) {
      recMatchedCount++;
    }
  }
  const recBonus = Math.min(10, recMatchedCount * 3);
  const skillMatchScore = Math.min(100, baseSkillScore + recBonus);

  // ==========================================
  // 2. COURSE MATCHING
  // ==========================================
  const userEnrollments = userData.courses?.enrollments || [];
  const completedCourses = userData.courses?.completedCourses || [];
  
  // Find relevant courses in user's learning history
  const relevantEnrollments = userEnrollments.filter((e) =>
    relatedCourses.some(
      (rc) =>
        (e.category && e.category.toLowerCase().includes(rc.toLowerCase())) ||
        (e.title && e.title.toLowerCase().includes(rc.toLowerCase()))
    )
  );

  let courseMatchScore = 0;
  if (relevantEnrollments.length > 0) {
    const totalProg = relevantEnrollments.reduce((acc, curr) => {
      return acc + (curr.status === "completed" ? 100 : curr.progress_percent || 0);
    }, 0);
    const avgRelevant = totalProg / relevantEnrollments.length;
    courseMatchScore = Math.min(100, Math.round(avgRelevant * 0.7 + Math.min(completedCourses.length, 2) * 15));
  } else if (completedCourses.length > 0) {
    // User has general coursework completion habits
    courseMatchScore = Math.min(50, completedCourses.length * 25);
  }

  // Find relevant courses from PostgreSQL catalog for this path
  const pathCourseRecommendations = dbCourses.filter((c) =>
    relatedCourses.some(
      (rc) =>
        (c.category && c.category.toLowerCase().includes(rc.toLowerCase())) ||
        (c.title && c.title.toLowerCase().includes(rc.toLowerCase()))
    )
  ).slice(0, 3);

  // ==========================================
  // 3. CODING MATCHING
  // ==========================================
  const solvedProblems = userData.coding?.solvedProblems || [];
  const acceptedSubmissions = userData.coding?.acceptedSubmissions || 0;

  let matchingSolvedCount = 0;
  let hardCount = 0;
  let mediumCount = 0;
  let easyCount = 0;

  for (const prob of solvedProblems) {
    const isCatMatch = relatedCodingCats.some(
      (cat) =>
        (prob.category && prob.category.toLowerCase().includes(cat.toLowerCase())) ||
        (Array.isArray(prob.tags) && prob.tags.some((t) => String(t).toLowerCase().includes(cat.toLowerCase())))
    );
    if (isCatMatch) matchingSolvedCount++;

    if (prob.difficulty === "Hard") hardCount++;
    else if (prob.difficulty === "Medium") mediumCount++;
    else easyCount++;
  }

  // Weight problem difficulty points
  const codingPoints = easyCount * 2 + mediumCount * 5 + hardCount * 10;
  const codingVolumeScore = Math.min(80, Math.round((codingPoints / 35) * 80));
  const codingRelevanceBonus = matchingSolvedCount > 0 ? Math.min(20, matchingSolvedCount * 10) : 0;
  const codingMatchScore = Math.min(100, codingVolumeScore + codingRelevanceBonus);

  // Filter relevant coding challenges from real problems DB
  const pathProblemRecommendations = dbProblems.filter((p) =>
    relatedCodingCats.some(
      (cat) =>
        (p.category && p.category.toLowerCase().includes(cat.toLowerCase())) ||
        (Array.isArray(p.tags) && p.tags.some((t) => String(t).toLowerCase().includes(cat.toLowerCase())))
    )
  ).slice(0, 4);

  // Filter relevant jobs and internships from real jobs DB
  const pathJobRecommendations = (dbJobs || []).filter((j) => {
    const catMatch = j.category && (
      j.category.toLowerCase().includes(path.category.toLowerCase()) ||
      path.category.toLowerCase().includes(j.category.toLowerCase()) ||
      j.title.toLowerCase().includes(path.name.toLowerCase()) ||
      path.name.toLowerCase().includes(j.title.toLowerCase())
    );
    const skillsMatched = Array.isArray(j.skills) && j.skills.some((js) =>
      requiredSkills.some((req) => skillsMatch(String(js), req)) ||
      recommendedSkills.some((rec) => skillsMatch(String(js), rec))
    );
    return catMatch || skillsMatched;
  }).slice(0, 4);

  // ==========================================
  // 4. PROJECT MATCHING
  // ==========================================
  const userProjects = userData.projects?.list || [];
  let matchingProjectsCount = 0;
  let completedMatchingCount = 0;

  for (const proj of userProjects) {
    const projTech = Array.isArray(proj.technologies) ? proj.technologies : [];
    const hasTechMatch = projTech.some((tech) =>
      requiredSkills.some((req) => skillsMatch(tech, req)) ||
      recommendedSkills.some((rec) => skillsMatch(tech, rec))
    );

    if (hasTechMatch) {
      matchingProjectsCount++;
      if (proj.status === "completed") {
        completedMatchingCount++;
      }
    }
  }

  let projectMatchScore = 0;
  if (completedMatchingCount >= 2) {
    projectMatchScore = 100;
  } else if (completedMatchingCount === 1) {
    projectMatchScore = 75;
  } else if (matchingProjectsCount > 0) {
    projectMatchScore = 50;
  } else if (userProjects.length > 0) {
    projectMatchScore = 30; // Has other projects, but not in this domain
  } else {
    projectMatchScore = 0; // Honest gap: no projects
  }

  // ==========================================
  // 5. EXPERIENCE SIGNALS (Activity, Not Employment)
  // ==========================================
  const appsCount = userData.jobs?.applicationsCount || 0;
  const proposalsCount = userData.freelance?.proposalsCount || 0;
  const completedContractsCount = userData.freelance?.completedCount || 0;

  const appScore = Math.min(40, (appsCount / 4) * 40);
  const propScore = Math.min(30, (proposalsCount / 3) * 30);
  const contractScore = Math.min(30, completedContractsCount * 30);
  const experienceScore = Math.min(100, Math.round(appScore + propScore + contractScore));

  // ==========================================
  // 6. PREFERENCES ALIGNMENT
  // ==========================================
  const targetRoles = userData.preferences?.target_roles || [];
  let preferenceScore = 60; // Neutral default baseline

  if (Array.isArray(targetRoles) && targetRoles.length > 0) {
    const matchesTarget = targetRoles.some(
      (tr) =>
        tr.toLowerCase() === path.slug.toLowerCase() ||
        tr.toLowerCase() === path.name.toLowerCase()
    );
    preferenceScore = matchesTarget ? 100 : 30;
  }

  // ==========================================
  // FINAL DETERMINISTIC COMPOSITE SCORE
  // ==========================================
  const rawScore =
    skillMatchScore * SCORING_WEIGHTS.skills +
    projectMatchScore * SCORING_WEIGHTS.projects +
    courseMatchScore * SCORING_WEIGHTS.courses +
    codingMatchScore * SCORING_WEIGHTS.coding +
    experienceScore * SCORING_WEIGHTS.experience +
    preferenceScore * SCORING_WEIGHTS.preferences;

  const readinessScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  // ==========================================
  // EVIDENCE GENERATION (Derived Strictly from Real Data)
  // ==========================================
  const evidence = [];

  if (matchedSkills.length > 0) {
    const topSkills = matchedSkills.slice(0, 3).join(", ");
    evidence.push({
      type: "skill",
      message: `Your verified proficiency in ${topSkills} aligns with core ${path.name} requirements.`,
    });
  }

  if (completedMatchingCount > 0) {
    evidence.push({
      type: "project",
      message: `You have ${completedMatchingCount} completed portfolio project${completedMatchingCount === 1 ? "" : "s"} utilizing related technologies.`,
    });
  } else if (userProjects.length > 0) {
    evidence.push({
      type: "project",
      message: `You have ${userProjects.length} portfolio project${userProjects.length === 1 ? "" : "s"}, though not yet specifically targeted at ${path.name}.`,
    });
  } else {
    evidence.push({
      type: "project",
      message: "No relevant project yet. Building a targeted portfolio project will significantly boost your score.",
    });
  }

  if (relevantEnrollments.length > 0) {
    const doneEnrollment = relevantEnrollments.find((e) => e.status === "completed");
    if (doneEnrollment) {
      evidence.push({
        type: "course",
        message: `You completed coursework in "${doneEnrollment.title}".`,
      });
    } else {
      evidence.push({
        type: "course",
        message: `You have active learning progress in ${relevantEnrollments.length} related curriculum course${relevantEnrollments.length === 1 ? "" : "s"}.`,
      });
    }
  }

  if (matchingSolvedCount > 0) {
    evidence.push({
      type: "coding",
      message: `Your coding activity includes ${matchingSolvedCount} accepted problem${matchingSolvedCount === 1 ? "" : "s"} in relevant algorithmic categories.`,
    });
  } else if (solvedProblems.length > 0) {
    evidence.push({
      type: "coding",
      message: `You have solved ${solvedProblems.length} problem${solvedProblems.length === 1 ? "" : "s"} on the platform.`,
    });
  }

  if (appsCount > 0 || proposalsCount > 0) {
    evidence.push({
      type: "experience",
      message: `Demonstrated market activity with ${appsCount} job application${appsCount === 1 ? "" : "s"} and ${proposalsCount} freelance proposal${proposalsCount === 1 ? "" : "s"}.`,
    });
  }

  return {
    id: path.id,
    slug: path.slug,
    name: path.name,
    category: path.category,
    level: path.level,
    icon: path.icon,
    description: path.description,
    score: readinessScore,
    breakdown: {
      skill_match_score: skillMatchScore,
      project_match_score: projectMatchScore,
      course_match_score: courseMatchScore,
      coding_match_score: codingMatchScore,
      experience_score: experienceScore,
      preference_score: preferenceScore,
    },
    skill_gaps: skillGaps,
    matched_skills: matchedSkills,
    partial_skills: partialSkills,
    missing_skills: missingSkills,
    evidence,
    recommended_courses: pathCourseRecommendations,
    recommended_problems: pathProblemRecommendations,
    recommended_jobs: pathJobRecommendations,
    related_projects: Array.isArray(path.related_projects) ? path.related_projects : [],
  };
}

/**
 * Generates up to 6 personalized, actionable next steps linked to real gaps.
 * Never recommends an action that the user has already fulfilled.
 * 
 * @param {Object} topPath - Top recommended career pathway
 * @param {Object} userData - User data
 * @param {Array<Object>} dbCourses - All published courses in DB
 * @returns {Array<Object>} List of personalized actions
 */
export function generatePersonalizedActionPlan(topPath, userData, dbCourses = []) {
  const actions = [];
  const missingSkills = topPath?.missing_skills || [];
  const partialSkills = topPath?.partial_skills || [];

  // 1. Address Top Missing Skill via Course or Skill addition
  if (missingSkills.length > 0) {
    const topMissing = missingSkills[0];
    const matchingCourse = dbCourses.find(
      (c) =>
        (c.title && c.title.toLowerCase().includes(topMissing.toLowerCase())) ||
        (c.category && c.category.toLowerCase().includes(topMissing.toLowerCase()))
    );

    if (matchingCourse) {
      actions.push({
        id: `action-course-${topMissing.toLowerCase().replace(/\s+/g, "-")}`,
        type: "course",
        action: `Enroll in ${matchingCourse.title}`,
        reason: `${topMissing} is a required skill for ${topPath.name}.`,
        ctaText: "Start Course",
        ctaLink: `/courses/${matchingCourse.slug}`,
      });
    } else {
      actions.push({
        id: `action-skill-${topMissing.toLowerCase().replace(/\s+/g, "-")}`,
        type: "skill",
        action: `Add verified ${topMissing} skill`,
        reason: `${topMissing} is currently missing from your verified competency profile.`,
        ctaText: "Add Skill",
        ctaLink: "/profile",
      });
    }
  }

  // 2. Practice Coding Problems if under benchmark
  const problemsSolved = userData.coding?.solvedCount || 0;
  if (problemsSolved < 10) {
    actions.push({
      id: "action-coding-practice",
      type: "coding",
      action: "Solve 5 algorithmic challenges",
      reason: `You have solved ${problemsSolved} problem${problemsSolved === 1 ? "" : "s"}. Benchmarks recommend at least 10 for technical interviews.`,
      ctaText: "Practice Problems",
      ctaLink: "/coding",
    });
  }

  // 3. Build a Portfolio Project if none completed
  const completedProjects = userData.projects?.completedCount || 0;
  if (completedProjects === 0) {
    actions.push({
      id: "action-build-project",
      type: "project",
      action: `Build a ${topPath.name} portfolio project`,
      reason: "Hiring managers and clients prioritize candidates with verifiable deployed code.",
      ctaText: "Create Project",
      ctaLink: "/profile",
    });
  }

  // 4. Strengthen Partial Skill
  if (partialSkills.length > 0 && actions.length < 6) {
    const topPartial = partialSkills[0];
    actions.push({
      id: `action-strengthen-${topPartial.toLowerCase().replace(/\s+/g, "-")}`,
      type: "skill",
      action: `Advance ${topPartial} to Advanced level`,
      reason: `You have beginner/intermediate familiarity with ${topPartial}. Elevating it reinforces your role match.`,
      ctaText: "Update Skill",
      ctaLink: "/profile",
    });
  }

  // 5. Complete Profile Summary if incomplete
  const profileCompleteness = userData.profile?.completeness?.percentage || 0;
  if (profileCompleteness < 90 && actions.length < 6) {
    actions.push({
      id: "action-complete-profile",
      type: "profile",
      action: "Complete profile summary and links",
      reason: `Your profile completeness is currently at ${profileCompleteness}%. Complete profiles receive 3x more recruiter visibility.`,
      ctaText: "Complete Profile",
      ctaLink: "/profile",
    });
  }

  // 6. Add GitHub or Portfolio URL if missing
  if ((!userData.profile?.github_url || !userData.profile?.portfolio_url) && actions.length < 6) {
    actions.push({
      id: "action-portfolio-links",
      type: "portfolio",
      action: "Connect GitHub and live portfolio links",
      reason: "Public repository and live demo links prove hands-on implementation capabilities.",
      ctaText: "Link Portfolio",
      ctaLink: "/profile",
    });
  }

  // 7. Fallback course explore if still room
  if (actions.length < 6 && dbCourses.length > 0) {
    actions.push({
      id: "action-explore-catalog",
      type: "course",
      action: "Explore technical curriculum tracks",
      reason: "Expand your technical breadth across industry standard engineering domains.",
      ctaText: "Explore Courses",
      ctaLink: "/courses",
    });
  }

  return actions.slice(0, 6);
}
