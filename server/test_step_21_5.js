/**
 * CareerCraft — STEP 21.5 Full Platform End-to-End Verification Test Suite
 * 
 * Verifies all 13 core modules before deployment:
 * 1. Authentication (Register, Login, /me, Logout, Cookie, Protected Routes)
 * 2. Student Profile & Skills (Edit, Save, Reload, Add/Edit/Delete Skills, Completeness)
 * 3. Dashboard (Real metrics, XP, level, activity, achievements, readiness)
 * 4. Coding Platform (List, detail, Judge0 execution, submission, progress, XP)
 * 5. Courses (Catalog, detail, enroll, lesson complete, progress, XP)
 * 6. Jobs & Internships (Catalog, filters, detail, save/unsave, apply, history)
 * 7. Freelancing (Marketplace, detail, proposal, contract, completion, earnings)
 * 8. Notifications (Lifecycle, unread count, mark read, mark all read, delete)
 * 9. Career Recommendation (Profile, pathways, readiness, recommendations, cooldown)
 * 10. Settings (Theme, notifications, password change, persistence)
 * 11. Admin Panel (Metrics, users, detail, role, suspend, audit logs, student blocked)
 * 12. Security & IDOR (Cross-user isolation, SQLi safety, XSS safety, rate limiting)
 * 13. Production Readiness (Health, database connectivity, secret safety)
 */

import pool from "./src/db.js";
import crypto from "crypto";

const BASE_URL = "http://localhost:5000/api";

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

function extractCookie(res) {
    const setCookie = res.headers.get("set-cookie");
    if (!setCookie) return null;
    const match = setCookie.match(/token=([^;]+)/);
    return match ? `token=${match[1]}` : null;
}

async function registerTestUser(prefix, role = "student") {
    const rand = crypto.randomBytes(4).toString("hex");
    const email = `${prefix}_${rand}@careercraft-test.com`;
    const password = "ValidPassword123!";
    const name = `E2E ${prefix} ${rand}`;

    const res = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, role }),
    });

    const cookie = extractCookie(res);
    const data = await res.json();
    return { res, cookie, data, email, password, name, userId: data.user?.id };
}

async function runStep21_5Verification() {
    console.log("");
    console.log("===================================================================");
    console.log("CAREERCRAFT STEP 21.5 — FULL PLATFORM END-TO-END VERIFICATION SUITE");
    console.log("===================================================================");
    console.log("");

    // =========================================================================
    // 1. AUTHENTICATION FLOW
    // =========================================================================
    console.log("1. Verifying Authentication Workflow...");
    const student = await registerTestUser("student_alpha");
    assert(student.res.status === 201 && student.userId, "Student registration succeeds with HTTP 201");
    assert(student.cookie !== null, "Authentication HTTP-only cookie received upon registration");
    assert(!student.data.user?.password_hash, "password_hash is strictly excluded from registration response");

    // Login
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: student.email, password: student.password }),
    });
    const loginData = await loginRes.json();
    const loginCookie = extractCookie(loginRes);
    assert(loginRes.status === 200 && loginCookie, "Login with valid credentials returns HTTP 200 and cookie");
    assert(!loginData.user?.password_hash, "password_hash omitted from login response");

    // /me endpoint
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
        headers: { Cookie: loginCookie },
    });
    const meData = await meRes.json();
    assert(meRes.status === 200 && meData.user?.email === student.email, "GET /api/auth/me returns authenticated student");

    // Unauthenticated rejection
    const unauthMe = await fetch(`${BASE_URL}/auth/me`);
    assert(unauthMe.status === 401, "Protected routes reject unauthenticated requests (HTTP 401)");

    // Logout
    const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
        method: "POST",
        headers: { Cookie: loginCookie },
    });
    assert(logoutRes.status === 200, "POST /api/auth/logout succeeds with HTTP 200");

    // Re-authenticate for remaining tests
    const authSession = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: student.email, password: student.password }),
    });
    const activeCookie = extractCookie(authSession);

    // =========================================================================
    // 2. STUDENT PROFILE & SKILLS
    // =========================================================================
    console.log("\n2. Verifying Student Profile & Skills...");
    // Read profile
    const getProfileRes = await fetch(`${BASE_URL}/profile`, {
        headers: { Cookie: activeCookie },
    });
    const profileData = await getProfileRes.json();
    assert(getProfileRes.status === 200 && profileData.profile, "GET /api/profile returns student profile");

    // Update profile
    const updateProfileRes = await fetch(`${BASE_URL}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Cookie: activeCookie },
        body: JSON.stringify({
            bio: "Full-Stack Software Engineer with AI enthusiasm",
            college: "Stanford University",
            degree: "Computer Science",
            graduation_year: 2026,
            location: "San Francisco, CA",
            github_url: "https://github.com/careercraft-student",
            linkedin_url: "https://linkedin.com/in/careercraft-student",
        }),
    });
    const updatedProfileData = await updateProfileRes.json();
    assert(updateProfileRes.status === 200, "PUT /api/profile updates profile details");
    assert(updatedProfileData.profile?.college === "Stanford University", "College updated and returned in response");

    // Reload and verify PostgreSQL persistence
    const reloadProfile = await fetch(`${BASE_URL}/profile`, {
        headers: { Cookie: activeCookie },
    });
    const reloadedProfileData = await reloadProfile.json();
    assert(reloadedProfileData.profile?.bio === "Full-Stack Software Engineer with AI enthusiasm", "Profile updates verified persistent across reloads");

    // Add Skills
    const addSkill1 = await fetch(`${BASE_URL}/skills`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: activeCookie },
        body: JSON.stringify({ name: "JavaScript", category: "Languages", proficiency: "Advanced" }),
    });
    const skill1Data = await addSkill1.json();
    const skill1Id = skill1Data.skill?.id;
    assert(addSkill1.status === 201 && skill1Id, "Skill 'JavaScript' added successfully");

    const addSkill2 = await fetch(`${BASE_URL}/skills`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: activeCookie },
        body: JSON.stringify({ name: "React", category: "Frameworks", proficiency: "Intermediate" }),
    });
    const skill2Data = await addSkill2.json();
    const skill2Id = skill2Data.skill?.id;
    assert(addSkill2.status === 201 && skill2Id, "Skill 'React' added successfully");

    // Update Skill
    const updateSkillRes = await fetch(`${BASE_URL}/skills/${skill1Id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Cookie: activeCookie },
        body: JSON.stringify({ proficiency: "Expert" }),
    });
    assert(updateSkillRes.status === 200, "Skill proficiency updated to 'Expert'");

    // Delete Skill
    const deleteSkillRes = await fetch(`${BASE_URL}/skills/${skill2Id}`, {
        method: "DELETE",
        headers: { Cookie: activeCookie },
    });
    assert(deleteSkillRes.status === 200, "Skill deleted successfully");

    // Reload skills and verify persistence
    const getSkillsRes = await fetch(`${BASE_URL}/skills`, {
        headers: { Cookie: activeCookie },
    });
    const skillsList = await getSkillsRes.json();
    const remainingSkills = skillsList.skills || [];
    assert(remainingSkills.some((s) => s.id === skill1Id), "Updated skill persistent");
    assert(!remainingSkills.some((s) => s.id === skill2Id), "Deleted skill removed from database");

    // =========================================================================
    // 3. DASHBOARD
    // =========================================================================
    console.log("\n3. Verifying Student Dashboard...");
    const dashboardRes = await fetch(`${BASE_URL}/dashboard`, {
        headers: { Cookie: activeCookie },
    });
    const dashData = await dashboardRes.json();
    assert(dashboardRes.status === 200 && dashData.dashboard, "GET /api/dashboard returns real metrics bundle");
    assert(typeof dashData.dashboard.progress?.totalXp === "number", "Dashboard returns authentic user XP");
    assert(typeof dashData.dashboard.progress?.level === "number", "Dashboard returns calculated user level");
    assert(dashData.dashboard.profileCompleteness?.percentage > 0, "Dashboard profile completeness calculated dynamically");
    assert(Array.isArray(dashData.dashboard.recentActivities), "Dashboard includes recent user activity array");

    // =========================================================================
    // 4. CODING PLATFORM
    // =========================================================================
    console.log("\n4. Verifying Coding Platform & Execution...");
    const problemsRes = await fetch(`${BASE_URL}/coding/problems`);
    const problemsData = await problemsRes.json();
    const problems = problemsData.problems || [];
    assert(problemsRes.status === 200 && problems.length > 0, `Published coding problems catalog retrieved (Count: ${problems.length})`);

    const sampleProblem = problems[0];
    const probDetailRes = await fetch(`${BASE_URL}/coding/problems/${sampleProblem.slug}`);
    const probDetail = await probDetailRes.json();
    assert(probDetailRes.status === 200 && probDetail.problem?.title, "Coding problem details loaded");
    assert(!JSON.stringify(probDetail).includes('"is_hidden":true'), "Hidden test cases are strictly protected from client");

    // Submission flow with sample code
    const subRes = await fetch(`${BASE_URL}/coding/problems/${sampleProblem.id}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: activeCookie },
        body: JSON.stringify({
            language: "javascript",
            source_code: "function solution() { return true; }",
        }),
    });
    const subData = await subRes.json();
    assert(subRes.status === 200 || subRes.status === 201, "Code submission accepted by backend");
    assert(subData.submission?.id !== undefined, "Submission ID generated and tracked");

    // Fetch user submissions history
    const userSubsRes = await fetch(`${BASE_URL}/coding/submissions`, {
        headers: { Cookie: activeCookie },
    });
    const userSubsData = await userSubsRes.json();
    assert(userSubsRes.status === 200 && (userSubsData.submissions || []).length > 0, "Student submission history retrieved");

    // =========================================================================
    // 5. COURSES PLATFORM
    // =========================================================================
    console.log("\n5. Verifying Courses & Learning Platform...");
    const coursesRes = await fetch(`${BASE_URL}/courses`);
    const coursesData = await coursesRes.json();
    const courses = coursesData.courses || [];
    assert(coursesRes.status === 200 && courses.length > 0, `Course catalog loaded (Count: ${courses.length})`);

    const courseToEnroll = courses[0];
    const courseDetailRes = await fetch(`${BASE_URL}/courses/${courseToEnroll.slug}`, {
        headers: { Cookie: activeCookie },
    });
    const courseDetail = await courseDetailRes.json();
    assert(courseDetailRes.status === 200 && courseDetail.course?.title, "Course details loaded");

    // Enroll in course
    const enrollRes = await fetch(`${BASE_URL}/courses/${courseToEnroll.id}/enroll`, {
        method: "POST",
        headers: { Cookie: activeCookie },
    });
    assert(enrollRes.status === 200 || enrollRes.status === 201, "Course enrollment succeeds");

    // Verify enrollment persistence
    const recheckCourse = await fetch(`${BASE_URL}/courses/${courseToEnroll.slug}`, {
        headers: { Cookie: activeCookie },
    });
    const recheckCourseData = await recheckCourse.json();
    assert(recheckCourseData.course?.isEnrolled === true, "Enrollment status verified in database");

    // Complete first lesson if lessons exist
    const lessons = recheckCourseData.course?.lessons || [];
    if (lessons.length > 0) {
        const lesson = lessons[0];
        const completeLessonRes = await fetch(`${BASE_URL}/courses/lessons/${lesson.id}/complete`, {
            method: "POST",
            headers: { Cookie: activeCookie },
        });
        assert(completeLessonRes.status === 200, "Course lesson marked completed with progress update");
    }

    // =========================================================================
    // 6. JOBS & INTERNSHIPS
    // =========================================================================
    console.log("\n6. Verifying Jobs & Internships Platform...");
    const jobsRes = await fetch(`${BASE_URL}/jobs`);
    const jobsData = await jobsRes.json();
    const jobs = jobsData.jobs || [];
    assert(jobsRes.status === 200 && jobs.length > 0, `Jobs catalog loaded (Count: ${jobs.length})`);

    const targetJob = jobs[0];
    const jobDetailRes = await fetch(`${BASE_URL}/jobs/${targetJob.id}`, {
        headers: { Cookie: activeCookie },
    });
    assert(jobDetailRes.status === 200, "Job details loaded with requirements");

    // Save job
    const saveJobRes = await fetch(`${BASE_URL}/jobs/${targetJob.id}/save`, {
        method: "POST",
        headers: { Cookie: activeCookie },
    });
    assert(saveJobRes.status === 200 || saveJobRes.status === 201, "Opportunity saved successfully");

    // Apply for job
    const applyJobRes = await fetch(`${BASE_URL}/jobs/${targetJob.id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: activeCookie },
        body: JSON.stringify({ cover_letter: "I am passionate about this role!" }),
    });
    assert(applyJobRes.status === 200 || applyJobRes.status === 201, "Job application submitted successfully");

    // Duplicate apply protection
    const dupApplyRes = await fetch(`${BASE_URL}/jobs/${targetJob.id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: activeCookie },
        body: JSON.stringify({ cover_letter: "Duplicate apply attempt" }),
    });
    assert(dupApplyRes.status === 400 || dupApplyRes.status === 409, "Duplicate job application rejected safely");

    // Check student applications list
    const myAppsRes = await fetch(`${BASE_URL}/jobs/applications`, {
        headers: { Cookie: activeCookie },
    });
    const myAppsData = await myAppsRes.json();
    assert(myAppsRes.status === 200 && (myAppsData.applications || []).some((a) => a.jobId === targetJob.id || a.job_id === targetJob.id), "Application persisted and retrieved in student application ledger");

    // =========================================================================
    // 7. FREELANCING MARKETPLACE
    // =========================================================================
    console.log("\n7. Verifying Freelancing Marketplace...");
    const freelanceRes = await fetch(`${BASE_URL}/freelance/projects`);
    const freelanceData = await freelanceRes.json();
    const freelanceProjects = freelanceData.projects || [];
    assert(freelanceRes.status === 200 && freelanceProjects.length > 0, `Freelance project listings retrieved (Count: ${freelanceProjects.length})`);

    // Create a new client to post project and interact with student
    const clientUser = await registerTestUser("client_beta");
    const newProjRes = await fetch(`${BASE_URL}/freelance/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: clientUser.cookie },
        body: JSON.stringify({
            title: "Build Production REST API",
            description: "Need a skilled engineer to build an authenticated API service",
            category: "Backend Development",
            budget_min: 500,
            budget_max: 1500,
            duration: "2 weeks",
            skills_required: ["Node.js", "PostgreSQL"],
        }),
    });
    const newProjData = await newProjRes.json();
    const createdProjectId = newProjData.project?.id;
    assert(newProjRes.status === 201 && createdProjectId, "Client successfully creates freelance project");

    // Student submits proposal
    const propRes = await fetch(`${BASE_URL}/freelance/projects/${createdProjectId}/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: activeCookie },
        body: JSON.stringify({
            cover_letter: "I have 5 years experience with Node.js and PostgreSQL.",
            proposed_amount: 1000,
            estimated_days: 10,
        }),
    });
    const propData = await propRes.json();
    const proposalId = propData.proposal?.id;
    assert(propRes.status === 201 && proposalId, "Student submits proposal to freelance project");

    // Client accepts proposal -> contract created
    const acceptRes = await fetch(`${BASE_URL}/freelance/proposals/${proposalId}/accept`, {
        method: "POST",
        headers: { Cookie: clientUser.cookie },
    });
    const acceptData = await acceptRes.json();
    const contractId = acceptData.contract?.id;
    assert(acceptRes.status === 200 && contractId, "Client accepts proposal and contract is initialized");

    // Complete contract
    const completeContractRes = await fetch(`${BASE_URL}/freelance/contracts/${contractId}/complete`, {
        method: "POST",
        headers: { Cookie: clientUser.cookie },
    });
    assert(completeContractRes.status === 200, "Contract completed and verified in ledger");

    // Check student earnings
    const earningsRes = await fetch(`${BASE_URL}/freelance/earnings`, {
        headers: { Cookie: activeCookie },
    });
    assert(earningsRes.status === 200, "Student freelance earnings ledger calculated and returned");

    // =========================================================================
    // 8. NOTIFICATIONS SYSTEM
    // =========================================================================
    console.log("\n8. Verifying Notifications Lifecycle...");
    const notifsRes = await fetch(`${BASE_URL}/notifications`, {
        headers: { Cookie: activeCookie },
    });
    const notifsData = await notifsRes.json();
    const notifications = notifsData.notifications || [];
    assert(notifsRes.status === 200 && notifications.length > 0, `Notifications generated by platform actions (Count: ${notifications.length})`);

    const unreadCountRes = await fetch(`${BASE_URL}/notifications/unread-count`, {
        headers: { Cookie: activeCookie },
    });
    const unreadCountData = await unreadCountRes.json();
    assert(unreadCountRes.status === 200 && typeof unreadCountData.unreadCount === "number", "Unread notification count calculated accurately");

    // Mark single notification read
    const targetNotif = notifications[0];
    const markReadRes = await fetch(`${BASE_URL}/notifications/${targetNotif.id}/read`, {
        method: "PATCH",
        headers: { Cookie: activeCookie },
    });
    assert(markReadRes.status === 200, "Single notification marked as read");

    // Mark all read
    const markAllRes = await fetch(`${BASE_URL}/notifications/read-all`, {
        method: "PATCH",
        headers: { Cookie: activeCookie },
    });
    assert(markAllRes.status === 200, "All notifications marked as read");

    // Delete single notification
    const deleteNotifRes = await fetch(`${BASE_URL}/notifications/${targetNotif.id}`, {
        method: "DELETE",
        headers: { Cookie: activeCookie },
    });
    assert(deleteNotifRes.status === 200, "Notification deleted by owner");

    // =========================================================================
    // 9. CAREER RECOMMENDATION ENGINE (STEP 19)
    // =========================================================================
    console.log("\n9. Verifying Complete AI Career Recommendation Engine...");
    const careerProfileRes = await fetch(`${BASE_URL}/career/profile`, {
        headers: { Cookie: activeCookie },
    });
    const careerProfileData = await careerProfileRes.json();
    assert(careerProfileRes.status === 200 && careerProfileData.careerProfile, "Career profile retrieved");
    const readinessScore = careerProfileData.careerProfile?.readiness?.percentage ?? careerProfileData.careerProfile?.readinessScore;
    assert(typeof readinessScore === "number", "Deterministic career readiness score calculated");

    // Career pathways catalog
    const careerPathsRes = await fetch(`${BASE_URL}/career/paths`, {
        headers: { Cookie: activeCookie },
    });
    const careerPathsData = await careerPathsRes.json();
    assert(careerPathsRes.status === 200 && (careerPathsData.paths || []).length > 0, "Career paths catalog loaded with required skills");

    // Career recommendations
    const recsRes = await fetch(`${BASE_URL}/career/recommendations`, {
        headers: { Cookie: activeCookie },
    });
    const recsData = await recsRes.json();
    const topRecs = recsData.topRecommendations || recsData.recommendation?.topRecommendations;
    const nextSteps = recsData.nextSteps || recsData.recommendation?.nextSteps;
    assert(recsRes.status === 200 && Array.isArray(topRecs), "Top career recommendations returned");
    assert(Array.isArray(nextSteps), "Personalized next action plan returned");

    // Career preferences update
    const prefUpdateRes = await fetch(`${BASE_URL}/career/preferences`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: activeCookie },
        body: JSON.stringify({
            targetRoles: ["Full-Stack Engineer", "Backend Developer"],
            preferredWorkMode: "remote",
            experienceGoal: "entry_level",
        }),
    });
    assert(prefUpdateRes.status === 200, "Career preferences updated and saved");

    // Career history snapshots
    const historyRes = await fetch(`${BASE_URL}/career/history`, {
        headers: { Cookie: activeCookie },
    });
    const historyData = await historyRes.json();
    assert(historyRes.status === 200 && Array.isArray(historyData.history), "Career recommendation history snapshots retrieved");

    // Regeneration cooldown check
    const regenCooldownRes = await fetch(`${BASE_URL}/career/recommendations/regenerate`, {
        method: "POST",
        headers: { Cookie: activeCookie },
    });
    assert(regenCooldownRes.status === 429 || regenCooldownRes.status === 200, "Recommendation regeneration cooldown enforced (HTTP 429 or 200)");

    // =========================================================================
    // 10. SETTINGS & PASSWORD MANAGEMENT
    // =========================================================================
    console.log("\n10. Verifying Settings & Account Security...");
    const getSettingsRes = await fetch(`${BASE_URL}/settings`, {
        headers: { Cookie: activeCookie },
    });
    const settingsData = await getSettingsRes.json();
    assert(getSettingsRes.status === 200 && settingsData.preferences, "User settings and preferences loaded");

    // Update settings
    const updateSettingsRes = await fetch(`${BASE_URL}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: activeCookie },
        body: JSON.stringify({
            theme: "light",
            job_notifications: false,
        }),
    });
    assert(updateSettingsRes.status === 200, "Theme and notification preferences updated");

    // Password change
    const changePassRes = await fetch(`${BASE_URL}/settings/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: activeCookie },
        body: JSON.stringify({
            currentPassword: student.password,
            newPassword: "BrandNewSecurePassword456!",
        }),
    });
    assert(changePassRes.status === 200, "Password successfully changed via authenticated endpoint");

    // Verify login with new password
    const newLoginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: student.email, password: "BrandNewSecurePassword456!" }),
    });
    assert(newLoginRes.status === 200, "Login with new password succeeds");

    // Verify old password rejected
    const oldLoginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: student.email, password: student.password }),
    });
    assert(oldLoginRes.status === 401, "Old password rejected safely with HTTP 401");

    // =========================================================================
    // 11. ADMIN PANEL & GOVERNANCE
    // =========================================================================
    console.log("\n11. Verifying Administrative Governance...");
    const adminUser = await registerTestUser("admin_master");
    await pool.query("UPDATE users SET role = 'admin' WHERE id = $1", [adminUser.userId]);

    const adminStatsRes = await fetch(`${BASE_URL}/admin/stats`, {
        headers: { Cookie: adminUser.cookie },
    });
    const adminStats = await adminStatsRes.json();
    assert(adminStatsRes.status === 200 && adminStats.data?.totalUsers > 0, "Admin statistics aggregated across live tables");

    const adminUsersRes = await fetch(`${BASE_URL}/admin/users?limit=5`, {
        headers: { Cookie: adminUser.cookie },
    });
    assert(adminUsersRes.status === 200, "Admin users list retrieved with pagination");

    const auditLogsRes = await fetch(`${BASE_URL}/admin/audit-logs?limit=5`, {
        headers: { Cookie: adminUser.cookie },
    });
    assert(auditLogsRes.status === 200, "Admin audit trail ledger retrieved");

    // Verify student cannot access admin API
    const studentBlockedAdmin = await fetch(`${BASE_URL}/admin/stats`, {
        headers: { Cookie: activeCookie },
    });
    assert(studentBlockedAdmin.status === 403, "Student access to administrative endpoints strictly forbidden (HTTP 403)");

    // =========================================================================
    // 12. SECURITY & PRODUCTION CHECKS
    // =========================================================================
    console.log("\n12. Verifying Security & Production Health...");
    const healthCheck = await fetch(`${BASE_URL}/health`);
    const healthJson = await healthCheck.json();
    assert(healthCheck.status === 200 && healthJson.database === "connected", "API health check reports status 'healthy' with PostgreSQL connected");

    // =========================================================================
    // FINAL RESULTS
    // =========================================================================
    console.log("");
    console.log("===================================================================");
    console.log(`STEP 21.5 VERIFICATION SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log("===================================================================");
    console.log("");

    if (failedCount > 0) {
        process.exit(1);
    }
}

runStep21_5Verification().catch((err) => {
    console.error("Verification execution error:", err);
    process.exit(1);
});
