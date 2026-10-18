import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const BASE_URL = "http://localhost:5000";

async function runTests() {
  console.log("=== STARTING STEP 08.1 SECURITY & PERSISTENCE TESTS ===");
  let exitCode = 0;
  let userAToken = null;
  let userBToken = null;
  let userA = null;
  let userB = null;
  let hiddenTestCaseId = null;
  let createdSubmissionId = null;

  try {
    // 1. Clean up any previous test artifacts
    await pool.query("DELETE FROM users WHERE email IN ('test_user_a_coding@careercraft.test', 'test_user_b_coding@careercraft.test')");

    // 2. Register User A
    const regARes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User A",
        email: "test_user_a_coding@careercraft.test",
        password: "Password123!",
      }),
    });
    const regAData = await regARes.json();
    const cookieA = regARes.headers.get("set-cookie");
    userA = regAData.user;
    userAToken = cookieA;
    console.log("✅ Registered User A:", userA.id);

    // 3. Register User B
    const regBRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User B",
        email: "test_user_b_coding@careercraft.test",
        password: "Password123!",
      }),
    });
    const regBData = await regBRes.json();
    const cookieB = regBRes.headers.get("set-cookie");
    userB = regBData.user;
    userBToken = cookieB;
    console.log("✅ Registered User B:", userB.id);

    // 4. Test GET /api/coding/problems (Public catalog)
    const problemsRes = await fetch(`${BASE_URL}/api/coding/problems`);
    const problemsData = await problemsRes.json();
    if (!problemsData.success || !Array.isArray(problemsData.problems) || problemsData.problems.length === 0) {
      throw new Error("Failed to fetch public problems catalog");
    }
    console.log(`✅ GET /api/coding/problems returned ${problemsData.problems.length} problems`);

    // Verify filter by difficulty
    const easyRes = await fetch(`${BASE_URL}/api/coding/problems?difficulty=Easy`);
    const easyData = await easyRes.json();
    const allEasy = easyData.problems.every((p) => p.difficulty === "Easy");
    if (!allEasy) throw new Error("Difficulty filter failed");
    console.log(`✅ Difficulty filter works (${easyData.problems.length} Easy problems)`);

    // Find two-sum problem
    const twoSum = problemsData.problems.find((p) => p.slug === "two-sum");
    if (!twoSum) throw new Error("two-sum problem not found in database");
    console.log(`✅ Found two-sum problem: ${twoSum.id}`);

    // Insert a hidden test case to explicitly verify hidden-test case protection
    const hiddenInsertRes = await pool.query(
      `INSERT INTO coding_test_cases (problem_id, input_data, expected_output, is_sample, is_hidden, test_order)
       VALUES ($1, '[10,20,30], 50', '[1,2]', false, true, 99)
       RETURNING id`,
      [twoSum.id]
    );
    hiddenTestCaseId = hiddenInsertRes.rows[0].id;
    console.log("✅ Inserted temporary hidden test case:", hiddenTestCaseId);

    // 5. Test GET /api/coding/problems/:slug
    const singleProblemRes = await fetch(`${BASE_URL}/api/coding/problems/two-sum`);
    const singleProblemData = await singleProblemRes.json();
    if (!singleProblemData.success || !singleProblemData.problem) {
      throw new Error("Failed to fetch single problem");
    }
    const prob = singleProblemData.problem;
    console.log("✅ GET /api/coding/problems/two-sum succeeded");

    // Check hidden test protection (TASK 15.E)
    if (prob.testCases) {
      const hasHidden = prob.testCases.some((tc) => tc.id === hiddenTestCaseId || tc.is_hidden === true);
      if (hasHidden) {
        throw new Error("CRITICAL SECURITY FAILURE: Hidden test case was exposed in public API!");
      }
    }
    console.log("✅ TASK 15.E PASSED: Hidden test cases are completely excluded from public problem API");

    // 6. Test TASK 15.A: Unauthenticated submission -> 401
    const unauthSubRes = await fetch(`${BASE_URL}/api/coding/problems/${twoSum.id}/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: "javascript",
        sourceCode: "function twoSum() { return [0, 1]; }",
      }),
    });
    if (unauthSubRes.status !== 401) {
      throw new Error(`Expected 401 for unauthenticated submission, got ${unauthSubRes.status}`);
    }
    console.log("✅ TASK 15.A PASSED: Unauthenticated submission rejected with 401");

    // 7. Test TASK 15.B & TASK 16: User A submits code
    const subARes = await fetch(`${BASE_URL}/api/coding/problems/${twoSum.id}/submissions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: userAToken,
      },
      body: JSON.stringify({
        language: "javascript",
        sourceCode: "function twoSum(nums, target) { return [0, 1]; }",
      }),
    });
    if (subARes.status !== 201 && subARes.status !== 200) {
      const errText = await subARes.text();
      throw new Error(`Submission failed with status ${subARes.status}: ${errText}`);
    }
    const subAData = await subARes.json();
    if (!subAData.success || (!subAData.submission.status)) {
      throw new Error("Submission response missing status");
    }
    createdSubmissionId = subAData.submission.id;
    console.log("✅ TASK 15.B & TASK 16 PASSED: User A submission created, ID:", createdSubmissionId);

    // Verify submission row in database
    const dbSubRes = await pool.query("SELECT * FROM coding_submissions WHERE id = $1", [createdSubmissionId]);
    if (dbSubRes.rows.length === 0) throw new Error("Submission not found in PostgreSQL");
    const dbSub = dbSubRes.rows[0];
    if (dbSub.user_id !== userA.id) throw new Error(`User ID mismatch: expected ${userA.id}, got ${dbSub.user_id}`);
    if (dbSub.problem_id !== twoSum.id) throw new Error(`Problem ID mismatch: expected ${twoSum.id}, got ${dbSub.problem_id}`);
    if (!dbSub.source_code.includes("twoSum")) throw new Error("source_code persistence failed");
    console.log("✅ TASK 16 PASSED: Database row verified: correct user_id, problem_id, persisted source_code");

    // Verify student_progress XP was NOT modified (TASK 14)
    const progressXPRes = await pool.query("SELECT total_xp FROM student_progress WHERE user_id = $1", [userA.id]);
    const xp = progressXPRes.rows[0]?.total_xp || 0;
    if (xp > 0) throw new Error(`CRITICAL FAILURE: XP was awarded for pending submission! XP = ${xp}`);
    console.log("✅ TASK 14 PASSED: No XP awarded for submission (total_xp = 0)");

    // 8. Test TASK 15.C: User B checks GET /api/coding/submissions
    const subBListRes = await fetch(`${BASE_URL}/api/coding/submissions`, {
      headers: { Cookie: userBToken },
    });
    const subBListData = await subBListRes.json();
    if (!subBListData.success) throw new Error("Failed to fetch User B submissions");
    const userAVisibleToB = subBListData.submissions.some((s) => s.id === createdSubmissionId || s.userId === userA.id);
    if (userAVisibleToB) {
      throw new Error("CRITICAL SECURITY FAILURE: User B can see User A's submissions!");
    }
    if (subBListData.submissions.length !== 0) {
      throw new Error(`Expected User B to have 0 submissions, got ${subBListData.submissions.length}`);
    }
    console.log("✅ TASK 15.C PASSED: User B cannot see User A's submission");

    // 9. Test TASK 15.D: Query spoofing: GET /api/coding/submissions?user_id=<UserA> as User B
    const spoofRes = await fetch(`${BASE_URL}/api/coding/submissions?user_id=${userA.id}`, {
      headers: { Cookie: userBToken },
    });
    const spoofData = await spoofRes.json();
    const spoofLeaked = spoofData.submissions.some((s) => s.id === createdSubmissionId || s.userId === userA.id);
    if (spoofLeaked || spoofData.submissions.length !== 0) {
      throw new Error("CRITICAL SECURITY FAILURE: Query spoofing allowed User B to access User A's submissions!");
    }
    console.log("✅ TASK 15.D PASSED: Query spoofing (?user_id=...) strictly ignored; only authenticated user data returned");

    // 10. Test TASK 15.F: Problem progress & ownership
    const progARes = await fetch(`${BASE_URL}/api/coding/problems/${twoSum.id}/progress`, {
      headers: { Cookie: userAToken },
    });
    const progAData = await progARes.json();
    if (!progAData.success || progAData.progress.status !== "attempted" || progAData.progress.attempts !== 1) {
      throw new Error(`User A progress mismatch: ${JSON.stringify(progAData)}`);
    }
    console.log("✅ TASK 15.F PASSED: User A progress shows status = 'attempted', attempts = 1");

    // User B checks progress for same problem
    const progBRes = await fetch(`${BASE_URL}/api/coding/problems/${twoSum.id}/progress`, {
      headers: { Cookie: userBToken },
    });
    const progBData = await progBRes.json();
    if (!progBData.success || progBData.progress.status !== "not_attempted" || progBData.progress.attempts !== 0) {
      throw new Error(`User B progress isolation failure: ${JSON.stringify(progBData)}`);
    }
    console.log("✅ TASK 15.F PASSED: User B progress isolated (status = 'not_attempted', attempts = 0)");

    // 11. Test TASK 15.G: Password security
    const allResponses = [problemsData, singleProblemData, subAData, subBListData, spoofData, progAData, progBData];
    for (const data of allResponses) {
      const str = JSON.stringify(data);
      if (str.includes("password_hash") || str.includes("Password123!")) {
        throw new Error("CRITICAL SECURITY FAILURE: Password hash or plain password leaked in API response!");
      }
    }
    console.log("✅ TASK 15.G PASSED: No password_hash or password leaked in any coding response");

    console.log("\n==================================================");
    console.log("ALL STEP 08.1 SECURITY & PERSISTENCE TESTS PASSED!");
    console.log("==================================================\n");
  } catch (err) {
    console.error("❌ TEST FAILED:", err);
    exitCode = 1;
  } finally {
    // Cleanup
    try {
      if (hiddenTestCaseId) {
        await pool.query("DELETE FROM coding_test_cases WHERE id = $1", [hiddenTestCaseId]);
      }
      if (userA || userB) {
        await pool.query("DELETE FROM users WHERE email IN ('test_user_a_coding@careercraft.test', 'test_user_b_coding@careercraft.test')");
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
