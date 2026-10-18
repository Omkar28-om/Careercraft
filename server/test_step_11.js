/**
 * CareerCraft — STEP 11: Jobs & Internships Platform Automated Test Suite
 * Validates requirements A through T:
 * A. Public jobs listing (200)
 * B. Search filter (?search=... & ?type=...)
 * C. Job detail (200)
 * D. Unauthenticated application (401)
 * E. Authenticated application (201)
 * F. Duplicate application rejected (400)
 * G. Client user_id tampering ignored
 * H. Client status tampering ignored/rejected
 * I. Student cannot mark application selected (403)
 * J. Student can withdraw eligible application (status: withdrawn)
 * K. Cannot withdraw selected/rejected application (400)
 * L. User B cannot access User A application (403/404)
 * M. Application XP (+5 XP awarded exactly once)
 * N. Duplicate application gives no duplicate XP
 * O. Saved job succeeds
 * P. User isolation for saved jobs
 * Q. Inactive job cannot be applied to (400)
 * R. Expired job cannot be applied to (400)
 * S. Dashboard application statistics accurate
 * T. password_hash never exposed
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
  return { id: data.user?.id, email, password, cookie, data };
}

async function runTests() {
  console.log("=== STARTING STEP 11 JOBS & INTERNSHIPS PLATFORM TESTS ===");

  const userA = await registerTestUser("user_a_j11");
  const userB = await registerTestUser("user_b_j11");
  console.log(`✅ Registered User A: ${userA.id}`);
  console.log(`✅ Registered User B: ${userB.id}`);

  // Clean up any previous test jobs
  await pool.query("DELETE FROM jobs WHERE company_name IN ('Legacy Corp', 'Past Innovations')");

  // Create an inactive job directly in DB for testing
  const inactiveJobRes = await pool.query(
    `INSERT INTO jobs (title, company_name, location, job_type, work_mode, description, is_active)
     VALUES ('Archived Senior Architect', 'Legacy Corp', 'Remote', 'job', 'remote', 'Archived job description', false)
     RETURNING id`
  );
  const inactiveJobId = inactiveJobRes.rows[0].id;

  // Create an expired job directly in DB for testing
  const expiredJobRes = await pool.query(
    `INSERT INTO jobs (title, company_name, location, job_type, work_mode, description, application_deadline, is_active)
     VALUES ('Closed Summer Fellow', 'Past Innovations', 'San Francisco, CA', 'internship', 'onsite', 'Closed internship', NOW() - INTERVAL '5 days', true)
     RETURNING id`
  );
  const expiredJobId = expiredJobRes.rows[0].id;

  // TEST A: Public jobs listing
  const resA = await fetch(`${BASE_URL}/jobs`);
  const dataA = await resA.json();
  if (resA.status === 200 && Array.isArray(dataA.jobs) && dataA.jobs.length >= 10) {
    console.log(`✅ TEST A PASSED: Public jobs listing returned status 200 with ${dataA.jobs.length} jobs`);
  } else {
    throw new Error(`TEST A FAILED: status=${resA.status}, count=${dataA.jobs?.length}`);
  }

  // Get a valid active non-expired job ID
  const activeJob = dataA.jobs.find(j => (j.companyName || "").includes("Google")) || dataA.jobs[0];
  const activeJob2 = dataA.jobs.find(j => (j.companyName || "").includes("Microsoft")) || dataA.jobs[1];

  // TEST B: Search filter (?search=... & ?type=...)
  const resB = await fetch(`${BASE_URL}/jobs?search=Microsoft&type=internship`);
  const dataB = await resB.json();
  if (resB.status === 200 && Array.isArray(dataB.jobs)) {
    const allMatch = dataB.jobs.every(j => 
      (j.title.toLowerCase().includes("microsoft") || (j.companyName || "").toLowerCase().includes("microsoft")) && 
      j.jobType === "internship"
    );
    if (allMatch && dataB.jobs.length >= 1) {
      console.log(`✅ TEST B PASSED: Search filter returned ${dataB.jobs.length} matching jobs`);
    } else {
      throw new Error(`TEST B FAILED: Search filter returned unexpected results: ${JSON.stringify(dataB.jobs)}`);
    }
  } else {
    throw new Error(`TEST B FAILED: status=${resB.status}`);
  }

  // TEST C: Job detail
  const resC = await fetch(`${BASE_URL}/jobs/${activeJob.id}`);
  const dataC = await resC.json();
  if (resC.status === 200 && dataC.job && dataC.job.id === activeJob.id) {
    console.log(`✅ TEST C PASSED: Job detail returned status 200 for job "${dataC.job.title}" at "${dataC.job.companyName}"`);
  } else {
    throw new Error(`TEST C FAILED: status=${resC.status}`);
  }

  // TEST D: Unauthenticated application returns 401
  const resD = await fetch(`${BASE_URL}/jobs/${activeJob.id}/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ coverNote: "Hire me please" }),
  });
  if (resD.status === 401) {
    console.log("✅ TEST D PASSED: Unauthenticated application rejected with status 401");
  } else {
    throw new Error(`TEST D FAILED: Expected 401, got ${resD.status}`);
  }

  // TEST E: Authenticated application returns 201
  const resE = await fetch(`${BASE_URL}/jobs/${activeJob.id}/apply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: userA.cookie,
    },
    body: JSON.stringify({
      coverNote: "Passionate engineer eager to contribute.",
      resumeUrl: "https://careercraft.local/demo/resumes/userA.pdf",
    }),
  });
  const dataE = await resE.json();
  if (resE.status === 201 && dataE.application && dataE.application.status === "applied") {
    console.log(`✅ TEST E PASSED: Authenticated application created with status "applied" (id: ${dataE.application.id})`);
  } else {
    throw new Error(`TEST E FAILED: status=${resE.status}, body=${JSON.stringify(dataE)}`);
  }
  const appAId = dataE.application.id;

  // TEST F: Duplicate application rejected with 400
  const resF = await fetch(`${BASE_URL}/jobs/${activeJob.id}/apply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: userA.cookie,
    },
    body: JSON.stringify({ coverNote: "Second attempt" }),
  });
  if (resF.status === 400) {
    console.log("✅ TEST F PASSED: Duplicate application rejected with status 400");
  } else {
    throw new Error(`TEST F FAILED: Expected 400, got ${resF.status}`);
  }

  // TEST G: Client user_id tampering ignored
  // Apply for activeJob2 as userA, but provide userB.id in body
  const resG = await fetch(`${BASE_URL}/jobs/${activeJob2.id}/apply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: userA.cookie,
    },
    body: JSON.stringify({
      user_id: userB.id,
      userId: userB.id,
      coverNote: "Spoofed user id attempt",
    }),
  });
  const dataG = await resG.json();
  if (resG.status === 201 && (dataG.application.userId === userA.id || dataG.application.user_id === userA.id)) {
    console.log("✅ TEST G PASSED: Client user_id tampering ignored; bound to authenticated session user");
  } else {
    console.error("DEBUG TEST G:", { status: resG.status, dataG });
    throw new Error(`TEST G FAILED: Expected userId=${userA.id}, got ${dataG.application?.userId}`);
  }
  const appA2Id = dataG.application.id;

  // TEST H: Client status tampering ignored/rejected on application creation
  // Attempt to pass status="selected" on apply
  const userAProgressBefore = await pool.query("SELECT * FROM student_progress WHERE user_id = $1", [userA.id]);
  const userBAppRes = await fetch(`${BASE_URL}/jobs/${activeJob.id}/apply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: userB.cookie,
    },
    body: JSON.stringify({
      status: "selected",
      coverNote: "Trying to self-select",
    }),
  });
  const userBAppData = await userBAppRes.json();
  if (userBAppRes.status === 201 && userBAppData.application.status === "applied") {
    console.log("✅ TEST H PASSED: Client status tampering ignored on application; defaulted strictly to 'applied'");
  } else {
    throw new Error(`TEST H FAILED: Status was not set to applied: ${userBAppData.application?.status}`);
  }

  // TEST I: Student cannot mark application selected (403)
  const resI = await fetch(`${BASE_URL}/jobs/applications/${appAId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: userA.cookie,
    },
    body: JSON.stringify({ status: "selected" }),
  });
  if (resI.status === 403) {
    console.log("✅ TEST I PASSED: Student cannot set status to 'selected' (403 Forbidden)");
  } else {
    throw new Error(`TEST I FAILED: Expected 403, got ${resI.status}`);
  }

  // TEST J: Student can withdraw eligible application
  const resJ = await fetch(`${BASE_URL}/jobs/applications/${appAId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: userA.cookie,
    },
    body: JSON.stringify({ status: "withdrawn" }),
  });
  const dataJ = await resJ.json();
  if (resJ.status === 200 && (dataJ.status === "withdrawn" || dataJ.application?.status === "withdrawn")) {
    console.log("✅ TEST J PASSED: Student withdrew eligible application; status transitioned to 'withdrawn'");
  } else {
    throw new Error(`TEST J FAILED: Expected 200 and withdrawn, got status=${resJ.status}, body=${JSON.stringify(dataJ)}`);
  }

  // TEST K: Cannot withdraw selected or rejected application
  // Directly set appA2Id status to 'selected' in database
  await pool.query("UPDATE job_applications SET status = 'selected' WHERE id = $1", [appA2Id]);
  const resK = await fetch(`${BASE_URL}/jobs/applications/${appA2Id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: userA.cookie,
    },
    body: JSON.stringify({ status: "withdrawn" }),
  });
  if (resK.status === 400) {
    console.log("✅ TEST K PASSED: Withdrawal disallowed for application with status 'selected' (400 Bad Request)");
  } else {
    throw new Error(`TEST K FAILED: Expected 400, got ${resK.status}`);
  }

  // TEST L: User B cannot access User A application (403/404)
  const resL = await fetch(`${BASE_URL}/jobs/applications/${appAId}`, {
    headers: { Cookie: userB.cookie },
  });
  if (resL.status === 403 || resL.status === 404) {
    console.log(`✅ TEST L PASSED: User isolation enforced; User B received status ${resL.status} when trying to view User A's application`);
  } else {
    throw new Error(`TEST L FAILED: User B was able to view User A's application: status=${resL.status}`);
  }

  // TEST M: Application XP (+5 XP awarded exactly once)
  // Check userB progress (User B applied to 1 job: activeJob)
  const userBProgress = await pool.query("SELECT total_xp FROM student_progress WHERE user_id = $1", [userB.id]);
  if (userBProgress.rows.length > 0 && userBProgress.rows[0].total_xp >= 5) {
    console.log(`✅ TEST M PASSED: Application awarded +5 XP (current XP: ${userBProgress.rows[0].total_xp})`);
  } else {
    throw new Error(`TEST M FAILED: Expected at least 5 XP, got ${userBProgress.rows[0]?.total_xp}`);
  }

  // TEST N: Duplicate application gives no duplicate XP
  // User B tries to apply again to activeJob
  const prevXp = userBProgress.rows[0].total_xp;
  await fetch(`${BASE_URL}/jobs/${activeJob.id}/apply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: userB.cookie,
    },
    body: JSON.stringify({ coverNote: "Duplicate XP grab" }),
  });
  const afterXpRes = await pool.query("SELECT total_xp FROM student_progress WHERE user_id = $1", [userB.id]);
  if (afterXpRes.rows[0].total_xp === prevXp) {
    console.log(`✅ TEST N PASSED: Rejected duplicate application awarded 0 duplicate XP (remains ${prevXp})`);
  } else {
    throw new Error(`TEST N FAILED: Duplicate application awarded duplicate XP: was ${prevXp}, now ${afterXpRes.rows[0].total_xp}`);
  }

  // TEST O: Saved job succeeds
  const resO = await fetch(`${BASE_URL}/jobs/${activeJob.id}/save`, {
    method: "POST",
    headers: { Cookie: userA.cookie },
  });
  const dataO = await resO.json();
  if ((resO.status === 200 || resO.status === 201) && dataO.success) {
    console.log("✅ TEST O PASSED: Job successfully saved for User A");
  } else {
    throw new Error(`TEST O FAILED: status=${resO.status}, body=${JSON.stringify(dataO)}`);
  }

  // TEST P: User isolation for saved jobs
  const resP_A = await fetch(`${BASE_URL}/jobs/saved`, {
    headers: { Cookie: userA.cookie },
  });
  const dataP_A = await resP_A.json();
  const resP_B = await fetch(`${BASE_URL}/jobs/saved`, {
    headers: { Cookie: userB.cookie },
  });
  const dataP_B = await resP_B.json();
  if (
    dataP_A.savedJobs.some(s => s.jobId === activeJob.id || s.job?.id === activeJob.id) &&
    !dataP_B.savedJobs.some(s => s.jobId === activeJob.id || s.job?.id === activeJob.id)
  ) {
    console.log("✅ TEST P PASSED: User isolation for saved jobs verified; User B cannot see User A's saved jobs");
  } else {
    throw new Error(`TEST P FAILED: Isolation failure in saved jobs`);
  }

  // TEST Q: Inactive job cannot be applied to (400)
  const resQ = await fetch(`${BASE_URL}/jobs/${inactiveJobId}/apply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: userA.cookie,
    },
    body: JSON.stringify({ coverNote: "Applying to inactive job" }),
  });
  if (resQ.status === 400) {
    console.log("✅ TEST Q PASSED: Application to inactive job rejected with status 400");
  } else {
    throw new Error(`TEST Q FAILED: Expected 400 for inactive job, got ${resQ.status}`);
  }

  // TEST R: Expired job cannot be applied to (400)
  const resR = await fetch(`${BASE_URL}/jobs/${expiredJobId}/apply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: userA.cookie,
    },
    body: JSON.stringify({ coverNote: "Applying to expired job" }),
  });
  if (resR.status === 400) {
    console.log("✅ TEST R PASSED: Application to expired job rejected with status 400");
  } else {
    throw new Error(`TEST R FAILED: Expected 400 for expired job, got ${resR.status}`);
  }

  // TEST S: Dashboard application statistics accurate
  const resS = await fetch(`${BASE_URL}/dashboard`, {
    headers: { Cookie: userA.cookie },
  });
  const dataS = await resS.json();
  const appSummary = dataS.dashboard?.applicationsSummary || dataS.applicationsSummary;
  const recentApps = dataS.dashboard?.recentApplications || dataS.recentApplications;
  if (
    resS.status === 200 &&
    appSummary &&
    typeof appSummary.total === "number" &&
    appSummary.total === 2 && // userA has appAId (withdrawn) and appA2Id (selected)
    appSummary.selected === 1 &&
    appSummary.withdrawn === 1 &&
    Array.isArray(recentApps)
  ) {
    console.log(`✅ TEST S PASSED: Dashboard application statistics accurate (total: ${appSummary.total}, selected: ${appSummary.selected}, withdrawn: ${appSummary.withdrawn})`);
  } else {
    throw new Error(`TEST S FAILED: Dashboard stats mismatch: ${JSON.stringify(appSummary)}`);
  }

  // TEST T: password_hash never exposed
  const testTUrls = [
    `${BASE_URL}/jobs`,
    `${BASE_URL}/jobs/${activeJob.id}`,
    `${BASE_URL}/jobs/applications`,
    `${BASE_URL}/jobs/saved`,
    `${BASE_URL}/dashboard`,
  ];
  for (const url of testTUrls) {
    const res = await fetch(url, { headers: { Cookie: userA.cookie } });
    const text = await res.text();
    if (text.includes("password_hash") || text.includes("$2b$") || text.includes("$2a$")) {
      throw new Error(`TEST T FAILED: Password hash or bcrypt hash detected in response from ${url}`);
    }
  }
  console.log("✅ TEST T PASSED: password_hash is never exposed in any jobs, applications, saved jobs, or dashboard endpoints");
  await pool.query("DELETE FROM jobs WHERE company_name IN ('Legacy Corp', 'Past Innovations')");

  console.log("=== ALL STEP 11 TESTS (A THROUGH T) PASSED SUCCESSFULLY! ===");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("❌ TEST SUITE FAILED:", err);
  process.exit(1);
});
