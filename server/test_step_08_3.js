import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const BASE_URL = "http://localhost:5000";

async function runTests() {
  console.log("=== STARTING STEP 08.3 JUDGE0 CE EXECUTION & SECURITY TESTS ===");
  let exitCode = 0;
  let userA = null;
  let userB = null;
  let cookieA = null;
  let cookieB = null;
  let twoSumProblem = null;
  let testCaseIds = [];

  try {
    // Clean up any test users
    await pool.query("DELETE FROM users WHERE email IN ('test_user_a_judge0@careercraft.test', 'test_user_b_judge0@careercraft.test')");

    // 1. Register User A
    const regARes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Judge0 Test User A",
        email: "test_user_a_judge0@careercraft.test",
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
        name: "Judge0 Test User B",
        email: "test_user_b_judge0@careercraft.test",
        password: "Password123!",
      }),
    });
    const regBData = await regBRes.json();
    userB = regBData.user;
    cookieB = regBRes.headers.get("set-cookie");
    console.log("✅ Registered User B:", userB.id);

    // 3. Fetch Two Sum problem
    const probRes = await fetch(`${BASE_URL}/api/coding/problems/two-sum`);
    const probData = await probRes.json();
    twoSumProblem = probData.problem;
    console.log(`✅ Loaded problem '${twoSumProblem.title}' (ID: ${twoSumProblem.id})`);

    // TEST A: Unauthenticated submission -> 401
    const testARes = await fetch(`${BASE_URL}/api/coding/problems/${twoSumProblem.id}/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: "javascript",
        sourceCode: "console.log('test');",
      }),
    });
    if (testARes.status !== 401) {
      throw new Error(`Expected 401 for unauthenticated submission, got ${testARes.status}`);
    }
    console.log("✅ TEST A PASSED: Unauthenticated submission rejected with 401");

    // TEST B: Unsupported language -> 400
    const testBRes = await fetch(`${BASE_URL}/api/coding/problems/${twoSumProblem.id}/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({
        language: "brainfuck",
        sourceCode: "++++++++++[>+++++++>++++++++++>+++>+<<<<-]>++.>+.+++++++..+++.",
      }),
    });
    if (testBRes.status !== 400) {
      throw new Error(`Expected 400 for unsupported language, got ${testBRes.status}`);
    }
    console.log("✅ TEST B PASSED: Unsupported language rejected with 400");

    // TEST C: Empty source code -> 400
    const testCRes = await fetch(`${BASE_URL}/api/coding/problems/${twoSumProblem.id}/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({
        language: "javascript",
        sourceCode: "    \n\t  ",
      }),
    });
    if (testCRes.status !== 400) {
      throw new Error(`Expected 400 for empty code, got ${testCRes.status}`);
    }
    console.log("✅ TEST C PASSED: Empty source code rejected with 400");

    // TEST D: Non-existent problem -> 404
    const testDRes = await fetch(`${BASE_URL}/api/coding/problems/00000000-0000-0000-0000-000000000000/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({
        language: "javascript",
        sourceCode: "console.log('hi');",
      }),
    });
    if (testDRes.status !== 404) {
      throw new Error(`Expected 404 for non-existent problem, got ${testDRes.status}`);
    }
    console.log("✅ TEST D PASSED: Non-existent problem rejected with 404");

    // TEST H: Hidden test cases protection
    // Add a temporary hidden test case to two-sum to verify it is NEVER returned by GET /api/coding/problems/:slug
    const hiddenInsert = await pool.query(
      `INSERT INTO coding_test_cases (problem_id, input_data, expected_output, is_sample, is_hidden, test_order)
       VALUES ($1, 'nums = [1,2,3], target = 5', '[1,2]', false, true, 99)
       RETURNING id`,
      [twoSumProblem.id]
    );
    testCaseIds.push(hiddenInsert.rows[0].id);

    const publicProbRes = await fetch(`${BASE_URL}/api/coding/problems/two-sum`);
    const publicProbData = await publicProbRes.json();
    const leakedHidden = (publicProbData.problem.testCases || []).some(
      (tc) => tc.id === hiddenInsert.rows[0].id || tc.is_hidden === true
    );
    if (leakedHidden) {
      throw new Error("SECURITY FAILURE: Hidden test case was exposed in public API!");
    }
    console.log("✅ TEST H PASSED: Hidden test cases strictly protected and excluded from public API");

    // TEST J: Submit WRONG solution -> status = 'wrong_answer', progress = 'attempted'
    const wrongSolutionCode = `
var twoSum = function(nums, target) {
    return [999, 999]; // intentionally wrong answer
};
`;
    console.log("⏳ Submitting wrong solution to Judge0...");
    const testJRes = await fetch(`${BASE_URL}/api/coding/problems/${twoSumProblem.id}/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({
        language: "javascript",
        sourceCode: wrongSolutionCode,
      }),
    });
    const testJData = await testJRes.json();
    if (testJData.submission.status !== "wrong_answer") {
      throw new Error(`Expected 'wrong_answer', got '${testJData.submission.status}'`);
    }
    if (testJData.xpAwarded !== 0) {
      throw new Error(`Expected 0 XP for wrong answer, got ${testJData.xpAwarded}`);
    }

    // Check progress for User A
    const progJRes = await fetch(`${BASE_URL}/api/coding/problems/${twoSumProblem.id}/progress`, {
      headers: { Cookie: cookieA },
    });
    const progJData = await progJRes.json();
    if (progJData.progress.status !== "attempted" || progJData.progress.attempts < 1) {
      throw new Error(`Expected status 'attempted', got: ${JSON.stringify(progJData)}`);
    }
    console.log(`✅ TEST J PASSED: Wrong solution evaluated to 'wrong_answer' (attempts: ${progJData.progress.attempts}, XP: 0)`);

    // TEST I: Submit ACCEPTED solution -> status = 'accepted', progress = 'solved', XP awarded
    const correctSolutionCode = `
var twoSum = function(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        map.set(nums[i], i);
    }
    return [];
};
`;
    console.log("⏳ Submitting correct solution to Judge0...");
    const testIRes = await fetch(`${BASE_URL}/api/coding/problems/${twoSumProblem.id}/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({
        language: "javascript",
        sourceCode: correctSolutionCode,
      }),
    });
    const testIData = await testIRes.json();
    if (testIData.submission.status !== "accepted") {
      throw new Error(`Expected 'accepted', got '${testIData.submission.status}' (${testIData.submission.errorMessage})`);
    }
    if (testIData.xpAwarded !== 10) {
      throw new Error(`Expected 10 XP for Easy problem first solve, got ${testIData.xpAwarded}`);
    }
    if (!testIData.isFirstSolve) {
      throw new Error("Expected isFirstSolve = true");
    }

    // Check progress for User A
    const progIRes = await fetch(`${BASE_URL}/api/coding/problems/${twoSumProblem.id}/progress`, {
      headers: { Cookie: cookieA },
    });
    const progIData = await progIRes.json();
    if (progIData.progress.status !== "solved") {
      throw new Error(`Expected status 'solved', got '${progIData.progress.status}'`);
    }

    // Check student_progress total_xp
    const xpRes = await pool.query("SELECT total_xp, problems_solved FROM student_progress WHERE user_id = $1", [userA.id]);
    const xpUserA = xpRes.rows[0]?.total_xp || 0;
    const solvedCountUserA = xpRes.rows[0]?.problems_solved || 0;
    if (xpUserA < 10 || solvedCountUserA !== 1) {
      throw new Error(`Expected total_xp >= 10, problems_solved = 1. Got xp=${xpUserA}, solved=${solvedCountUserA}`);
    }

    // Check user_activity for problem_solved
    const actRes = await pool.query("SELECT * FROM user_activity WHERE user_id = $1 AND activity_type = 'problem_solved'", [userA.id]);
    if (actRes.rows.length === 0) {
      throw new Error("No 'problem_solved' activity record found in user_activity");
    }
    console.log(`✅ TEST I PASSED: Solution accepted by Judge0! (XP earned: +10, Total XP: ${xpUserA}, Problems Solved: ${solvedCountUserA})`);

    // TEST K: Duplicate accepted submission -> NO duplicate XP
    console.log("⏳ Submitting duplicate accepted solution to verify no duplicate XP...");
    const testKRes = await fetch(`${BASE_URL}/api/coding/problems/${twoSumProblem.id}/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({
        language: "javascript",
        sourceCode: correctSolutionCode,
      }),
    });
    const testKData = await testKRes.json();
    if (testKData.submission.status !== "accepted") {
      throw new Error(`Duplicate submission expected 'accepted', got '${testKData.submission.status}'`);
    }
    if (testKData.xpAwarded !== 0) {
      throw new Error(`Expected 0 XP for duplicate solve, got ${testKData.xpAwarded}`);
    }
    if (testKData.isFirstSolve !== false) {
      throw new Error("Expected isFirstSolve = false on duplicate submission");
    }

    // Verify User A total XP did not increase
    const xpAfterKRes = await pool.query("SELECT total_xp, problems_solved FROM student_progress WHERE user_id = $1", [userA.id]);
    const xpAfterK = xpAfterKRes.rows[0]?.total_xp;
    if (xpAfterK !== xpUserA) {
      throw new Error(`Duplicate solve awarded extra XP! Initial=${xpUserA}, After=${xpAfterK}`);
    }
    console.log(`✅ TEST K PASSED: Duplicate accepted submission awarded 0 extra XP (Total XP remained ${xpAfterK})`);

    // TEST G: User isolation -> User B cannot see User A's submissions
    const subBListRes = await fetch(`${BASE_URL}/api/coding/submissions`, {
      headers: { Cookie: cookieB },
    });
    const subBListData = await subBListRes.json();
    if (subBListData.submissions.length !== 0) {
      throw new Error(`User B saw submissions that belong to User A! Count: ${subBListData.submissions.length}`);
    }
    console.log("✅ TEST G PASSED: User B cannot see User A's submissions (isolation verified)");

    // TEST L: password_hash security check
    const checkPayloads = [probData, testJData, testIData, testKData, subBListData];
    for (const p of checkPayloads) {
      const s = JSON.stringify(p);
      if (s.includes("password_hash") || s.includes("Password123!")) {
        throw new Error("SECURITY FAILURE: password_hash or plain password leaked in API response!");
      }
    }
    console.log("✅ TEST L PASSED: No password_hash or password strings leaked anywhere");

    console.log("\n==================================================");
    console.log("ALL STEP 08.3 JUDGE0 CE TESTS PASSED SUCCESSFULLY!");
    console.log("==================================================\n");
  } catch (err) {
    console.error("❌ TEST FAILED:", err);
    exitCode = 1;
  } finally {
    // Safe cleanup
    try {
      if (testCaseIds.length > 0) {
        await pool.query("DELETE FROM coding_test_cases WHERE id = ANY($1)", [testCaseIds]);
      }
      if (userA || userB) {
        await pool.query("DELETE FROM users WHERE email IN ('test_user_a_judge0@careercraft.test', 'test_user_b_judge0@careercraft.test')");
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
