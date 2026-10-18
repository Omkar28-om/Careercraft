/**
 * CareerCraft — STEP 19 Automated Test Suite
 * 
 * Comprehensive tests for Complete AI Career Recommendation System:
 * A. Career path catalog
 * B. Career path detail
 * C. Career profile
 * D. Career preferences
 * E. Preferences persistence
 * F. Recommendations
 * G. Deterministic scores
 * H. Career readiness
 * I. Evidence
 * J. Skill gaps
 * K. Next actions
 * L. History
 * M. Regeneration
 * N. Regeneration cooldown
 * O. User isolation
 * P. user_id spoofing
 * Q. Authentication
 * R. Invalid preferences
 * S. Invalid path
 * T. Password hash protection
 * U. Sensitive data protection
 * V. Dashboard integration
 * W. Profile integration
 * X. Existing coding regression
 * Y. Existing course regression
 * Z. Existing jobs regression
 * AA. Existing freelance regression
 * AB. Existing notifications regression
 * AC. Existing admin regression
 */

import pool from "./src/db.js";
import crypto from "crypto";

const BASE_URL = "http://localhost:5000/api";

function extractCookie(res) {
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) return null;
  const match = setCookie.match(/token=([^;]+)/);
  return match ? `token=${match[1]}` : null;
}

async function registerTestUser(prefix) {
  const rand = crypto.randomBytes(4).toString("hex");
  const email = `${prefix}_${rand}@example.com`;
  const password = "Password123!";
  const name = `Test ${prefix} ${rand}`;

  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name, role: "student" }),
  });

  const data = await res.json();
  const cookie = extractCookie(res);
  return { id: data.user?.id, email, name, cookie };
}

let passedCount = 0;
let failedCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failedCount++;
  }
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("CAREERCRAFT STEP 19 — CAREER RECOMMENDATION TEST SUITE");
  console.log("=======================================================\n");

  // 1. Setup Two Isolated Test Users
  console.log("Setting up test users in PostgreSQL...");
  const userA = await registerTestUser("user_a");
  const userB = await registerTestUser("user_b");

  assert(userA.cookie !== null, "User A successfully registered and authenticated");
  assert(userB.cookie !== null, "User B successfully registered and authenticated");

  // Add verified skills to User A to test real data matching
  await pool.query(
    `INSERT INTO skills (user_id, name, category, proficiency)
     VALUES 
      ($1, 'JavaScript', 'Frontend', 'Expert'),
      ($1, 'React', 'Frontend', 'Advanced'),
      ($1, 'Node.js', 'Backend', 'Intermediate'),
      ($1, 'PostgreSQL', 'Database', 'Intermediate')
     ON CONFLICT DO NOTHING`,
    [userA.id]
  );

  // A. Career Path Catalog
  console.log("\nA. Testing Career Path Catalog...");
  const catalogRes = await fetch(`${BASE_URL}/career/paths`, {
    headers: { Cookie: userA.cookie },
  });
  const catalogData = await catalogRes.json();
  assert(catalogRes.status === 200, "GET /api/career/paths returns HTTP 200");
  assert(Array.isArray(catalogData.paths), "Response has paths array");
  assert(catalogData.paths.length >= 13, `Catalog contains all seeded paths (Found: ${catalogData.paths?.length})`);

  // B. Career Path Detail
  console.log("\nB. Testing Career Path Detail...");
  const pathDetailRes = await fetch(`${BASE_URL}/career/paths/frontend-developer`, {
    headers: { Cookie: userA.cookie },
  });
  const pathDetail = await pathDetailRes.json();
  assert(pathDetailRes.status === 200, "GET /api/career/paths/frontend-developer returns 200");
  assert(pathDetail.path?.name === "Frontend Developer", "Returns Frontend Developer record");
  assert(Array.isArray(pathDetail.path?.required_skills), "Has required_skills array");

  // C. Career Profile
  console.log("\nC. Testing Career Profile...");
  const profileRes = await fetch(`${BASE_URL}/career/profile`, {
    headers: { Cookie: userA.cookie },
  });
  const profileData = await profileRes.json();
  assert(profileRes.status === 200, "GET /api/career/profile returns HTTP 200");
  assert(profileData.careerProfile?.user?.id === userA.id, "Career profile belongs to authenticated user A");
  assert(Array.isArray(profileData.careerProfile?.skills), "Career profile contains verified user skills");
  assert(profileData.careerProfile?.readiness?.percentage !== undefined, "Readiness percentage calculated");

  // D & E. Career Preferences & Persistence
  console.log("\nD & E. Testing Career Preferences...");
  const prefPayload = {
    target_roles: ["frontend-developer", "full-stack-developer"],
    preferred_domains: ["Frontend", "AI & ML"],
    preferred_work_mode: "remote",
    experience_goal: "entry_level",
  };
  const prefRes = await fetch(`${BASE_URL}/career/preferences`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: userA.cookie },
    body: JSON.stringify(prefPayload),
  });
  const prefData = await prefRes.json();
  assert(prefRes.status === 200, "PATCH /api/career/preferences returns HTTP 200");
  assert(prefData.preferences?.preferred_work_mode === "remote", "Work mode updated to remote");
  assert(prefData.preferences?.target_roles.length === 2, "Target roles persisted");

  // Verify persistence via GET /api/career/profile
  const verifyPrefRes = await fetch(`${BASE_URL}/career/profile`, {
    headers: { Cookie: userA.cookie },
  });
  const verifyPrefData = await verifyPrefRes.json();
  assert(verifyPrefData.careerProfile?.preferences?.preferred_work_mode === "remote", "Preferences persisted in PostgreSQL");

  // F. Recommendations
  console.log("\nF. Testing Recommendations...");
  const recRes = await fetch(`${BASE_URL}/career/recommendations`, {
    headers: { Cookie: userA.cookie },
  });
  const recData = await recRes.json();
  assert(recRes.status === 200, "GET /api/career/recommendations returns HTTP 200");
  assert(Array.isArray(recData.recommendation?.topRecommendations), "Has topRecommendations array");
  assert(recData.recommendation?.topRecommendations.length > 0, "Top recommendations populated");

  // G. Deterministic Scores
  console.log("\nG. Testing Deterministic Scores...");
  const recRes2 = await fetch(`${BASE_URL}/career/recommendations`, {
    headers: { Cookie: userA.cookie },
  });
  const recData2 = await recRes2.json();
  const score1 = recData.recommendation?.topRecommendations[0]?.score;
  const score2 = recData2.recommendation?.topRecommendations[0]?.score;
  assert(score1 === score2, `Scores are 100% deterministic (${score1}% === ${score2}%)`);

  // H. Career Readiness
  console.log("\nH. Testing Career Readiness...");
  const readiness = recData.recommendation?.careerReadiness;
  assert(readiness?.percentage >= 0 && readiness?.percentage <= 100, `Readiness is between 0-100 (${readiness?.percentage}%)`);
  assert(typeof readiness?.label === "string", `Readiness label present: "${readiness?.label}"`);

  // I. Evidence
  console.log("\nI. Testing Evidence...");
  const topRec = recData.recommendation?.topRecommendations[0];
  assert(Array.isArray(topRec?.evidence), "Top recommendation has evidence array");
  assert(topRec?.evidence.length > 0, `Evidence derived from real user data (Count: ${topRec?.evidence.length})`);
  assert(topRec?.evidence[0]?.message !== undefined, "Evidence contains descriptive message");

  // J. Skill Gaps
  console.log("\nJ. Testing Skill Gaps...");
  assert(Array.isArray(topRec?.skill_gaps), "Top recommendation has skill_gaps array");
  assert(topRec?.skill_gaps.length > 0, `Skill gaps identified (Count: ${topRec?.skill_gaps.length})`);
  const missingSkill = topRec?.skill_gaps.find((g) => g.status === "missing");
  const strongSkill = topRec?.skill_gaps.find((g) => g.status === "strong");
  assert(missingSkill !== undefined, "Detected missing skill gap correctly");
  assert(strongSkill !== undefined, "Detected strong verified skill correctly");

  // K. Next Actions
  console.log("\nK. Testing Personalized Actions...");
  const nextSteps = recData.recommendation?.nextSteps;
  assert(Array.isArray(nextSteps), "Has nextSteps array");
  assert(nextSteps.length <= 6, `Next actions bounded to max 6 (Count: ${nextSteps.length})`);
  assert(nextSteps[0]?.ctaLink !== undefined, "Action has valid ctaLink");

  // L. History
  console.log("\nL. Testing History...");
  const historyRes = await fetch(`${BASE_URL}/career/history`, {
    headers: { Cookie: userA.cookie },
  });
  const historyData = await historyRes.json();
  assert(historyRes.status === 200, "GET /api/career/history returns HTTP 200");
  assert(Array.isArray(historyData.history), "History returns array of snapshots");
  assert(historyData.history.length >= 1, `Found ${historyData.history.length} snapshot(s) for User A`);

  // N. Regeneration Cooldown
  console.log("\nN. Testing Regeneration Cooldown...");
  const regenRes1 = await fetch(`${BASE_URL}/career/recommendations/regenerate`, {
    method: "POST",
    headers: { Cookie: userA.cookie },
  });
  const regenData1 = await regenRes1.json();
  assert(regenRes1.status === 429, "Second regeneration within 5 minutes blocked with HTTP 429");
  assert(regenData1.retryAfterSeconds > 0, `Returns retryAfterSeconds: ${regenData1.retryAfterSeconds}`);

  // M. Regeneration after cooldown (simulated by updating snapshot timestamp in DB)
  console.log("\nM. Testing Regeneration after Cooldown Expiry...");
  await pool.query(
    `UPDATE career_recommendation_snapshots 
     SET generated_at = NOW() - INTERVAL '6 minutes' 
     WHERE user_id = $1`,
    [userA.id]
  );
  const regenRes2 = await fetch(`${BASE_URL}/career/recommendations/regenerate`, {
    method: "POST",
    headers: { Cookie: userA.cookie },
  });
  const regenData2 = await regenRes2.json();
  assert(regenRes2.status === 200, "Regeneration succeeds after cooldown (HTTP 200)");
  assert(regenData2.recommendation?.id !== undefined, "New snapshot created");

  // O. User Isolation
  console.log("\nO. Testing User Isolation...");
  const userBHistoryRes = await fetch(`${BASE_URL}/career/history`, {
    headers: { Cookie: userB.cookie },
  });
  const userBHistory = await userBHistoryRes.json();
  assert(userBHistory.history.length === 0, "User B history is empty (User A snapshots isolated)");

  const userBProfileRes = await fetch(`${BASE_URL}/career/profile`, {
    headers: { Cookie: userB.cookie },
  });
  const userBProfile = await userBProfileRes.json();
  assert(userBProfile.careerProfile?.user?.id === userB.id, "User B profile belongs strictly to User B");
  assert(userBProfile.careerProfile?.skills.length === 0, "User B does not see User A's verified skills");

  // P. user_id Spoofing
  console.log("\nP. Testing user_id Spoofing Protection...");
  const spoofPayload = {
    user_id: userB.id,
    target_roles: ["data-scientist"],
    preferred_work_mode: "hybrid",
  };
  const spoofRes = await fetch(`${BASE_URL}/career/preferences`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: userA.cookie },
    body: JSON.stringify(spoofPayload),
  });
  // Check that User B was NOT modified
  const userBCheck = await pool.query(
    `SELECT target_roles FROM career_preferences WHERE user_id = $1`,
    [userB.id]
  );
  assert(userBCheck.rows.length === 0 || !userBCheck.rows[0].target_roles.includes("data-scientist"), "user_id in request body is ignored; User B unaffected");

  // Q. Authentication
  console.log("\nQ. Testing Authentication Enforcement...");
  const unauthRes = await fetch(`${BASE_URL}/career/recommendations`);
  assert(unauthRes.status === 401, "Unauthenticated request returns HTTP 401");

  // R. Invalid Preferences
  console.log("\nR. Testing Invalid Preferences Validation...");
  const invalidPrefRes = await fetch(`${BASE_URL}/career/preferences`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: userA.cookie },
    body: JSON.stringify({ preferred_work_mode: "invalid_mode_value" }),
  });
  assert(invalidPrefRes.status === 400, "Invalid work mode rejected with HTTP 400");

  // S. Invalid Path
  console.log("\nS. Testing Invalid Path Handling...");
  const invalidPathRes = await fetch(`${BASE_URL}/career/paths/non-existent-career-path-xyz`, {
    headers: { Cookie: userA.cookie },
  });
  assert(invalidPathRes.status === 404, "Non-existent career path returns HTTP 404");

  // T. Password Hash Protection
  console.log("\nT. Testing Password Hash Protection...");
  const stringifiedProfile = JSON.stringify(profileData);
  assert(!stringifiedProfile.includes("password_hash"), "password_hash is NEVER exposed in profile API");
  const stringifiedRec = JSON.stringify(recData);
  assert(!stringifiedRec.includes("password_hash"), "password_hash is NEVER exposed in recommendations API");

  // U. Sensitive Data Protection
  console.log("\nU. Testing Sensitive Attributes Protection...");
  const sensitiveKeys = ["religion", "caste", "political", "health", "race", "jwt", "secret"];
  let sensitiveFound = false;
  for (const k of sensitiveKeys) {
    if (stringifiedRec.toLowerCase().includes(`"${k}"`)) {
      sensitiveFound = true;
      break;
    }
  }
  assert(!sensitiveFound, "No sensitive attributes (religion, caste, health, tokens) used in recommendations");

  // V. Dashboard Integration Regression
  console.log("\nV. Testing Dashboard Integration...");
  const dashRes = await fetch(`${BASE_URL}/dashboard`, {
    headers: { Cookie: userA.cookie },
  });
  assert(dashRes.status === 200, "GET /api/dashboard returns HTTP 200");

  // W. Profile Integration Regression
  console.log("\nW. Testing Profile Integration...");
  const profRes = await fetch(`${BASE_URL}/profile`, {
    headers: { Cookie: userA.cookie },
  });
  assert(profRes.status === 200, "GET /api/profile returns HTTP 200");

  // X. Coding Platform Regression
  console.log("\nX. Testing Coding Platform Regression...");
  const codingRes = await fetch(`${BASE_URL}/coding/problems`, {
    headers: { Cookie: userA.cookie },
  });
  assert(codingRes.status === 200, "GET /api/coding/problems returns HTTP 200");

  // Y. Courses Regression
  console.log("\nY. Testing Courses Regression...");
  const coursesRes = await fetch(`${BASE_URL}/courses`, {
    headers: { Cookie: userA.cookie },
  });
  assert(coursesRes.status === 200, "GET /api/courses returns HTTP 200");

  // Z. Jobs Regression
  console.log("\nZ. Testing Jobs Platform Regression...");
  const jobsRes = await fetch(`${BASE_URL}/jobs`, {
    headers: { Cookie: userA.cookie },
  });
  assert(jobsRes.status === 200, "GET /api/jobs returns HTTP 200");

  // AA. Freelance Regression
  console.log("\nAA. Testing Freelance Platform Regression...");
  const freelanceRes = await fetch(`${BASE_URL}/freelance/projects`, {
    headers: { Cookie: userA.cookie },
  });
  assert(freelanceRes.status === 200, "GET /api/freelance/projects returns HTTP 200");

  // AB. Notifications Regression
  console.log("\nAB. Testing Notifications Regression...");
  const notifRes = await fetch(`${BASE_URL}/notifications`, {
    headers: { Cookie: userA.cookie },
  });
  assert(notifRes.status === 200, "GET /api/notifications returns HTTP 200");

  // AC. Admin Panel Role Protection Regression
  console.log("\nAC. Testing Admin Access Regression...");
  const adminRes = await fetch(`${BASE_URL}/admin/overview`, {
    headers: { Cookie: userA.cookie },
  });
  assert(adminRes.status === 403, "Student denied access to /admin/overview (HTTP 403)");

  // Clean up test users
  await pool.query("DELETE FROM users WHERE id IN ($1, $2)", [userA.id, userB.id]);

  console.log("\n=======================================================");
  console.log(`TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("=======================================================\n");

  await pool.end();
  process.exit(failedCount > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
