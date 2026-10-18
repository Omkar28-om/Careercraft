import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const BASE_URL = "http://localhost:5000";

async function runTests() {
  console.log("=== STARTING STEP 09 STUDENT PROJECTS & PORTFOLIO TESTS ===");
  let exitCode = 0;
  let userA = null;
  let userB = null;
  let cookieA = null;
  let cookieB = null;
  let projectAId = null;
  let projectPrivateId = null;

  try {
    // 0. Clean up previous test users if any
    await pool.query("DELETE FROM users WHERE email IN ('test_user_a_proj@careercraft.test', 'test_user_b_proj@careercraft.test')");

    // 1. Register User A
    const regARes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User A Projects",
        email: "test_user_a_proj@careercraft.test",
        password: "Password123!",
      }),
    });
    const regAData = await regARes.json();
    userA = regAData.user;
    cookieA = regARes.headers.get("set-cookie");
    console.log("✅ Registered User A:", userA.id);

    // 2. Register User B
    const regBRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User B Projects",
        email: "test_user_b_proj@careercraft.test",
        password: "Password123!",
      }),
    });
    const regBData = await regBRes.json();
    userB = regBData.user;
    cookieB = regBRes.headers.get("set-cookie");
    console.log("✅ Registered User B:", userB.id);

    // TEST A: Unauthenticated GET projects -> 401
    const testARes = await fetch(`${BASE_URL}/api/projects`);
    if (testARes.status !== 401) {
      throw new Error(`Expected 401 for unauthenticated GET /api/projects, got ${testARes.status}`);
    }
    console.log("✅ TEST A PASSED: Unauthenticated GET /api/projects rejected with 401");

    // TEST B: Unauthenticated POST project -> 401
    const testBRes = await fetch(`${BASE_URL}/api/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Test Project",
      }),
    });
    if (testBRes.status !== 401) {
      throw new Error(`Expected 401 for unauthenticated POST /api/projects, got ${testBRes.status}`);
    }
    console.log("✅ TEST B PASSED: Unauthenticated POST /api/projects rejected with 401");

    // TEST K: Empty title -> 400
    const testKRes = await fetch(`${BASE_URL}/api/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({
        title: "   ",
        description: "Empty title test",
      }),
    });
    if (testKRes.status !== 400) {
      throw new Error(`Expected 400 for empty title, got ${testKRes.status}`);
    }
    console.log("✅ TEST K PASSED: Empty title rejected with 400");

    // TEST H: Invalid status -> 400
    const testHRes = await fetch(`${BASE_URL}/api/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({
        title: "Test Status",
        status: "invalid_status_xyz",
      }),
    });
    if (testHRes.status !== 400) {
      throw new Error(`Expected 400 for invalid status, got ${testHRes.status}`);
    }
    console.log("✅ TEST H PASSED: Invalid status rejected with 400");

    // TEST I: Invalid project type -> 400
    const testIRes = await fetch(`${BASE_URL}/api/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({
        title: "Test Type",
        project_type: "super_secret_type",
      }),
    });
    if (testIRes.status !== 400) {
      throw new Error(`Expected 400 for invalid project_type, got ${testIRes.status}`);
    }
    console.log("✅ TEST I PASSED: Invalid project_type rejected with 400");

    // TEST J: Invalid GitHub URL -> 400
    const testJRes = await fetch(`${BASE_URL}/api/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({
        title: "Test URL",
        github_url: "not-a-valid-url-format",
      }),
    });
    if (testJRes.status !== 400) {
      throw new Error(`Expected 400 for invalid github_url, got ${testJRes.status}`);
    }
    console.log("✅ TEST J PASSED: Invalid GitHub URL rejected with 400");

    // TEST C & G: User A creates project (with client user_id spoofing attempt)
    // Client attempts to pass user_id = User B's ID
    const testCRes = await fetch(`${BASE_URL}/api/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({
        user_id: userB.id, // spoofing attempt!
        title: "CareerCraft Ecosystem",
        description: "Complete student career development platform with coding sandbox.",
        project_type: "personal",
        status: "in_progress",
        technologies: ["React", "Node.js", "PostgreSQL", "Tailwind CSS"],
        github_url: "https://github.com/careercraft/careercraft",
        live_url: "https://careercraft.dev",
        is_featured: true,
        is_public: true,
      }),
    });
    if (testCRes.status !== 201) {
      const errText = await testCRes.text();
      throw new Error(`Expected 201 for project creation, got ${testCRes.status}: ${errText}`);
    }
    const testCData = await testCRes.json();
    projectAId = testCData.project.id;
    if (testCData.project.userId !== userA.id) {
      throw new Error(`CRITICAL SECURITY FAILURE: user_id spoofing succeeded! Expected ${userA.id}, got ${testCData.project.userId}`);
    }
    console.log("✅ TEST C & G PASSED: User A project created with status 201; client user_id spoofing ignored");

    // TEST O: Project creation XP (+5 XP)
    const progAfterC = await pool.query("SELECT total_xp FROM student_progress WHERE user_id = $1", [userA.id]);
    const xpAfterC = progAfterC.rows[0]?.total_xp || 0;
    if (xpAfterC !== 5) {
      throw new Error(`Expected 5 XP after project creation, got ${xpAfterC}`);
    }
    console.log("✅ TEST O PASSED: Project creation awarded +5 XP exactly once");

    // TEST D: User A sees own project
    const testDRes = await fetch(`${BASE_URL}/api/projects`, {
      headers: { Cookie: cookieA },
    });
    const testDData = await testDRes.json();
    const foundProj = testDData.projects.find((p) => p.id === projectAId);
    if (!foundProj) {
      throw new Error("User A cannot see created project");
    }
    console.log("✅ TEST D PASSED: User A successfully retrieves own projects");

    // TEST E: User B cannot modify User A project -> 403
    const testERes = await fetch(`${BASE_URL}/api/projects/${projectAId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: cookieB },
      body: JSON.stringify({
        title: "Malicious Tampering by User B",
      }),
    });
    if (testERes.status !== 403) {
      throw new Error(`Expected 403 when User B tries to modify User A's project, got ${testERes.status}`);
    }
    console.log("✅ TEST E PASSED: User B cannot modify User A's project (403 Forbidden)");

    // TEST F: User B cannot delete User A project -> 403
    const testFRes = await fetch(`${BASE_URL}/api/projects/${projectAId}`, {
      method: "DELETE",
      headers: { Cookie: cookieB },
    });
    if (testFRes.status !== 403) {
      throw new Error(`Expected 403 when User B tries to delete User A's project, got ${testFRes.status}`);
    }
    console.log("✅ TEST F PASSED: User B cannot delete User A's project (403 Forbidden)");

    // TEST L: Fourth featured project rejection (max 3)
    // User A already has 1 featured project (CareerCraft Ecosystem). Add 2 more featured projects:
    const f2 = await fetch(`${BASE_URL}/api/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({ title: "Featured Proj 2", is_featured: true }),
    });
    const f3 = await fetch(`${BASE_URL}/api/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({ title: "Featured Proj 3", is_featured: true }),
    });
    if (f2.status !== 201 || f3.status !== 201) {
      throw new Error("Failed to create 2nd and 3rd featured projects");
    }
    // Now attempt 4th featured project -> must fail with 400
    const f4 = await fetch(`${BASE_URL}/api/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({ title: "Featured Proj 4", is_featured: true }),
    });
    if (f4.status !== 400) {
      throw new Error(`Expected 400 for 4th featured project, got ${f4.status}`);
    }
    console.log("✅ TEST L PASSED: Enforced maximum of 3 featured projects per user (4th rejected with 400)");

    // Create a private project for User A to test public endpoint filtering
    const privRes = await fetch(`${BASE_URL}/api/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({
        title: "Confidential Internal Tool",
        is_public: false,
      }),
    });
    const privData = await privRes.json();
    projectPrivateId = privData.project.id;

    // TEST M & N: Public projects endpoint
    const pubRes = await fetch(`${BASE_URL}/api/projects/public/${userA.id}`);
    const pubData = await pubRes.json();
    if (!pubData.success || !Array.isArray(pubData.projects)) {
      throw new Error("Failed to fetch public projects");
    }
    const publicIds = pubData.projects.map((p) => p.id);
    if (!publicIds.includes(projectAId)) {
      throw new Error("Public project missing from public endpoint");
    }
    if (publicIds.includes(projectPrivateId)) {
      throw new Error("SECURITY FAILURE: Private project appeared in public endpoint!");
    }
    console.log("✅ TEST M & N PASSED: Public endpoint returns only is_public=true projects (private project filtered)");

    // TEST P: Project completion (+10 XP)
    const xpBeforeP = (await pool.query("SELECT total_xp FROM student_progress WHERE user_id = $1", [userA.id])).rows[0]?.total_xp;
    const testPRes = await fetch(`${BASE_URL}/api/projects/${projectAId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({
        status: "completed",
      }),
    });
    const testPData = await testPRes.json();
    if (testPData.project.status !== "completed") {
      throw new Error("Status failed to update to completed");
    }
    if (testPData.completionXpAwarded !== 10) {
      throw new Error(`Expected 10 completion XP, got ${testPData.completionXpAwarded}`);
    }
    const xpAfterP = (await pool.query("SELECT total_xp FROM student_progress WHERE user_id = $1", [userA.id])).rows[0]?.total_xp;
    if (xpAfterP !== xpBeforeP + 10) {
      throw new Error(`XP calculation mismatch: before=${xpBeforeP}, after=${xpAfterP}, expected=${xpBeforeP + 10}`);
    }
    console.log(`✅ TEST P PASSED: Transitioning to completed awarded +10 XP (XP: ${xpBeforeP} -> ${xpAfterP})`);

    // TEST Q: Repeated edit after completion -> NO duplicate completion XP
    const testQRes = await fetch(`${BASE_URL}/api/projects/${projectAId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({
        title: "CareerCraft Ecosystem V2",
        status: "completed", // keeping completed
      }),
    });
    const testQData = await testQRes.json();
    if (testQData.completionXpAwarded !== 0) {
      throw new Error(`Expected 0 duplicate completion XP, got ${testQData.completionXpAwarded}`);
    }
    const xpAfterQ = (await pool.query("SELECT total_xp FROM student_progress WHERE user_id = $1", [userA.id])).rows[0]?.total_xp;
    if (xpAfterQ !== xpAfterP) {
      throw new Error(`Duplicate completion XP awarded! Initial=${xpAfterP}, After=${xpAfterQ}`);
    }
    console.log("✅ TEST Q PASSED: Editing an already completed project awarded 0 duplicate completion XP");

    // TEST R: Dashboard projects_completed reflects database
    const dashRes = await fetch(`${BASE_URL}/api/dashboard`, {
      headers: { Cookie: cookieA },
    });
    const dashData = await dashRes.json();
    const projectsCompletedDash = dashData.dashboard?.careerProgress?.projectsCompleted;
    if (projectsCompletedDash !== 1) {
      throw new Error(`Expected 1 projectsCompleted in dashboard, got ${projectsCompletedDash}`);
    }
    console.log(`✅ TEST R PASSED: Dashboard accurately shows projectsCompleted = ${projectsCompletedDash}`);

    // TEST S: No password_hash exposure
    const checkPayloads = [testCData, testDData, pubData, testPData, testQData, dashData];
    for (const p of checkPayloads) {
      const s = JSON.stringify(p);
      if (s.includes("password_hash") || s.includes("Password123!")) {
        throw new Error("SECURITY FAILURE: password_hash leaked in API response!");
      }
    }
    console.log("✅ TEST S PASSED: No password_hash leaked anywhere in project responses");

    console.log("\n==================================================");
    console.log("ALL STEP 09 STUDENT PROJECTS & PORTFOLIO TESTS PASSED!");
    console.log("==================================================\n");
  } catch (err) {
    console.error("❌ TEST FAILED:", err);
    exitCode = 1;
  } finally {
    // Safe cleanup
    try {
      if (userA || userB) {
        await pool.query("DELETE FROM users WHERE email IN ('test_user_a_proj@careercraft.test', 'test_user_b_proj@careercraft.test')");
      }
      console.log("🧹 Test artifacts safely cleaned up.");
    } catch (cleanErr) {
      console.error("Cleanup error:", cleanErr);
    }
    await pool.end();
    process.exit(exitCode);
  }
}

runTests();
