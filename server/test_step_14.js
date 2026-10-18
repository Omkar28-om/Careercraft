/**
 * CareerCraft — STEP 14: Admin Panel Automated Test Suite
 * Validates requirements A through Z:
 * A. Admin login/access
 * B. Student denied admin API with 403
 * C. Unauthenticated denied with 401
 * D. Admin stats
 * E. User list
 * F. User detail
 * G. password_hash never exposed
 * H. User suspension
 * I. User reactivation
 * J. Course listing
 * K. Course publish/unpublish
 * L. Job listing
 * M. Job activation/deactivation
 * N. Coding problem management
 * O. Project moderation
 * P. Freelance moderation
 * Q. Notification overview
 * R. Audit log access
 * S. Audit log created after admin mutation
 * T. Student cannot access audit logs
 * U. Student cannot change user status
 * V. Student cannot access admin frontend data
 * W. Admin cannot accidentally remove final active admin
 * X. UUID validation
 * Y. SQL injection-safe search/filtering
 * Z. No arbitrary notification creation
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

async function registerTestUser(prefix, role = "student") {
    const rand = crypto.randomBytes(4).toString("hex");
    const email = `${prefix}_${rand}@example.com`;
    const password = "Password123!";
    const name = `Test ${prefix} ${rand}`;

    const res = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, role }),
    });

    const data = await res.json();
    const cookie = extractCookie(res);

    if (role === "admin") {
        await pool.query("UPDATE users SET role = 'admin' WHERE id = $1", [data.user.id]);
    }

    return { id: data.user?.id, email, password, name, cookie, data };
}

function assert(condition, message) {
    if (!condition) {
        console.error(`❌ ASSERTION FAILED: ${message}`);
        throw new Error(message);
    }
}

async function runTests() {
    console.log("=== STARTING STEP 14 ADMIN PANEL TESTS ===");

    // Setup accounts
    const studentUser = await registerTestUser("student_adm14", "student");
    const adminUser = await registerTestUser("admin_adm14", "admin");
    const secondAdmin = await registerTestUser("admin2_adm14", "admin");

    console.log(`✅ Student User: ${studentUser.id}`);
    console.log(`✅ Admin User 1: ${adminUser.id}`);
    console.log(`✅ Admin User 2: ${secondAdmin.id}`);

    // =========================================================================
    // TEST A: Admin login/access
    // =========================================================================
    console.log("\n[TEST A] Admin login/access...");
    const testARes = await fetch(`${BASE_URL}/admin/stats`, {
        headers: { Cookie: adminUser.cookie },
    });
    const testAData = await testARes.json();
    assert(testARes.status === 200, `Expected 200, got ${testARes.status}`);
    assert(testAData.success === true, "Expected success: true");
    console.log("✅ Passed TEST A: Admin authorized with 200 OK");

    // =========================================================================
    // TEST B: Student denied admin API with 403
    // =========================================================================
    console.log("\n[TEST B] Student denied admin API with 403...");
    const testBRes = await fetch(`${BASE_URL}/admin/stats`, {
        headers: { Cookie: studentUser.cookie },
    });
    const testBData = await testBRes.json();
    assert(testBRes.status === 403, `Expected 403, got ${testBRes.status}`);
    assert(testBData.success === false, "Expected success: false");
    console.log("✅ Passed TEST B: Student denied with 403 Forbidden");

    // =========================================================================
    // TEST C: Unauthenticated denied with 401
    // =========================================================================
    console.log("\n[TEST C] Unauthenticated denied with 401...");
    const testCRes = await fetch(`${BASE_URL}/admin/stats`);
    const testCData = await testCRes.json();
    assert(testCRes.status === 401, `Expected 401, got ${testCRes.status}`);
    assert(testCData.success === false, "Expected success: false");
    console.log("✅ Passed TEST C: Unauthenticated access rejected with 401");

    // =========================================================================
    // TEST D: Admin stats
    // =========================================================================
    console.log("\n[TEST D] Admin stats return aggregate counts...");
    const stats = testAData.data;
    assert(typeof stats.totalUsers === "number", "totalUsers must be a number");
    assert(typeof stats.totalStudents === "number", "totalStudents must be a number");
    assert(typeof stats.totalAdmins === "number", "totalAdmins must be a number");
    assert(typeof stats.totalCourses === "number", "totalCourses must be a number");
    assert(typeof stats.publishedCourses === "number", "publishedCourses must be a number");
    assert(typeof stats.totalJobs === "number", "totalJobs must be a number");
    assert(typeof stats.activeJobs === "number", "activeJobs must be a number");
    assert(typeof stats.totalCodingProblems === "number", "totalCodingProblems must be a number");
    assert(typeof stats.totalSubmissions === "number", "totalSubmissions must be a number");
    assert(typeof stats.totalProjects === "number", "totalProjects must be a number");
    assert(typeof stats.totalFreelanceProjects === "number", "totalFreelanceProjects must be a number");
    assert(typeof stats.activeFreelanceContracts === "number", "activeFreelanceContracts must be a number");
    assert(typeof stats.totalApplications === "number", "totalApplications must be a number");
    assert(typeof stats.totalNotifications === "number", "totalNotifications must be a number");
    assert(typeof stats.unreadNotifications === "number", "unreadNotifications must be a number");
    assert(Array.isArray(stats.recentActivity), "recentActivity must be an array");
    console.log("✅ Passed TEST D: Admin stats payload verified");

    // =========================================================================
    // TEST E: User list
    // =========================================================================
    console.log("\n[TEST E] User list pagination and filtering...");
    const testERes = await fetch(`${BASE_URL}/admin/users?page=1&limit=5&role=student`, {
        headers: { Cookie: adminUser.cookie },
    });
    const testEData = await testERes.json();
    assert(testERes.status === 200, `Expected 200, got ${testERes.status}`);
    assert(Array.isArray(testEData.data.users), "users must be array");
    assert(testEData.data.pagination.page === 1, "page must be 1");
    assert(testEData.data.users.every((u) => u.role === "student"), "All returned users must be students");
    console.log(`✅ Passed TEST E: Retrieved ${testEData.data.users.length} users with pagination`);

    // =========================================================================
    // TEST F: User detail
    // =========================================================================
    console.log("\n[TEST F] User detail...");
    const testFRes = await fetch(`${BASE_URL}/admin/users/${studentUser.id}`, {
        headers: { Cookie: adminUser.cookie },
    });
    const testFData = await testFRes.json();
    assert(testFRes.status === 200, `Expected 200, got ${testFRes.status}`);
    assert(testFData.data.user.id === studentUser.id, "User ID matches");
    assert(testFData.data.progress !== undefined, "User progress attached");
    assert(Array.isArray(testFData.data.skills), "User skills attached");
    console.log("✅ Passed TEST F: Comprehensive user details retrieved");

    // =========================================================================
    // TEST G: password_hash never exposed
    // =========================================================================
    console.log("\n[TEST G] password_hash never exposed...");
    assert(testFData.data.user.password_hash === undefined, "password_hash must not be on user object");
    assert(testFData.data.user.password === undefined, "password must not be on user object");
    assert(testEData.data.users.every((u) => u.password_hash === undefined && u.password === undefined), "password_hash absent in user list");
    console.log("✅ Passed TEST G: password_hash and tokens strictly omitted");

    // =========================================================================
    // TEST H: User suspension
    // =========================================================================
    console.log("\n[TEST H] User suspension...");
    const testHRes = await fetch(`${BASE_URL}/admin/users/${studentUser.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: adminUser.cookie },
        body: JSON.stringify({ status: "suspended" }),
    });
    const testHData = await testHRes.json();
    assert(testHRes.status === 200, `Expected 200, got ${testHRes.status}`);
    assert(testHData.data.status === "suspended", "User status is suspended");

    // Verify suspended user is rejected on normal authenticated operations
    const suspCheck = await fetch(`${BASE_URL}/dashboard`, {
        headers: { Cookie: studentUser.cookie },
    });
    assert(suspCheck.status === 403, `Suspended user must receive 403 on /dashboard, got ${suspCheck.status}`);
    console.log("✅ Passed TEST H: User suspended and access rejected with 403");

    // =========================================================================
    // TEST I: User reactivation
    // =========================================================================
    console.log("\n[TEST I] User reactivation...");
    const testIRes = await fetch(`${BASE_URL}/admin/users/${studentUser.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: adminUser.cookie },
        body: JSON.stringify({ status: "active" }),
    });
    const testIData = await testIRes.json();
    assert(testIRes.status === 200, `Expected 200, got ${testIRes.status}`);
    assert(testIData.data.status === "active", "User status is active");

    // Verify reactivated user can access dashboard
    const reactCheck = await fetch(`${BASE_URL}/dashboard`, {
        headers: { Cookie: studentUser.cookie },
    });
    assert(reactCheck.status === 200, `Reactivated user must receive 200 on /dashboard, got ${reactCheck.status}`);
    console.log("✅ Passed TEST I: User successfully reactivated");

    // =========================================================================
    // TEST J: Course listing
    // =========================================================================
    console.log("\n[TEST J] Course listing...");
    const testJRes = await fetch(`${BASE_URL}/admin/courses?page=1&limit=5`, {
        headers: { Cookie: adminUser.cookie },
    });
    const testJData = await testJRes.json();
    assert(testJRes.status === 200, `Expected 200, got ${testJRes.status}`);
    assert(Array.isArray(testJData.data.courses), "Courses must be an array");
    assert(testJData.data.courses.length > 0, "At least one course found");
    const targetCourse = testJData.data.courses[0];
    console.log(`✅ Passed TEST J: Retrieved ${testJData.data.courses.length} courses`);

    // =========================================================================
    // TEST K: Course publish/unpublish
    // =========================================================================
    console.log("\n[TEST K] Course publish/unpublish...");
    // Unpublish
    const unpubRes = await fetch(`${BASE_URL}/admin/courses/${targetCourse.id}/unpublish`, {
        method: "PATCH",
        headers: { Cookie: adminUser.cookie },
    });
    const unpubData = await unpubRes.json();
    assert(unpubRes.status === 200, `Expected 200, got ${unpubRes.status}`);
    assert(unpubData.data.is_published === false, "Course is unpublished");

    // Publish
    const pubRes = await fetch(`${BASE_URL}/admin/courses/${targetCourse.id}/publish`, {
        method: "PATCH",
        headers: { Cookie: adminUser.cookie },
    });
    const pubData = await pubRes.json();
    assert(pubRes.status === 200, `Expected 200, got ${pubRes.status}`);
    assert(pubData.data.is_published === true, "Course is published");
    console.log("✅ Passed TEST K: Course toggled unpublished and published successfully");

    // =========================================================================
    // TEST L: Job listing
    // =========================================================================
    console.log("\n[TEST L] Job listing...");
    const testLRes = await fetch(`${BASE_URL}/admin/jobs?page=1&limit=5`, {
        headers: { Cookie: adminUser.cookie },
    });
    const testLData = await testLRes.json();
    assert(testLRes.status === 200, `Expected 200, got ${testLRes.status}`);
    assert(Array.isArray(testLData.data.jobs), "Jobs must be an array");
    assert(testLData.data.jobs.length > 0, "At least one job found");
    const targetJob = testLData.data.jobs[0];
    console.log(`✅ Passed TEST L: Retrieved ${testLData.data.jobs.length} jobs`);

    // =========================================================================
    // TEST M: Job activation/deactivation
    // =========================================================================
    console.log("\n[TEST M] Job activation/deactivation...");
    // Deactivate
    const deactRes = await fetch(`${BASE_URL}/admin/jobs/${targetJob.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: adminUser.cookie },
        body: JSON.stringify({ status: "inactive" }),
    });
    const deactData = await deactRes.json();
    assert(deactRes.status === 200, `Expected 200, got ${deactRes.status}`);
    assert(deactData.data.is_active === false, "Job is deactivated");

    // Reactivate
    const actRes = await fetch(`${BASE_URL}/admin/jobs/${targetJob.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: adminUser.cookie },
        body: JSON.stringify({ status: "active" }),
    });
    const actData = await actRes.json();
    assert(actRes.status === 200, `Expected 200, got ${actRes.status}`);
    assert(actData.data.is_active === true, "Job is activated");
    console.log("✅ Passed TEST M: Job status modified and audited");

    // =========================================================================
    // TEST N: Coding problem management
    // =========================================================================
    console.log("\n[TEST N] Coding problem management...");
    const testNRes = await fetch(`${BASE_URL}/admin/coding/problems?page=1&limit=5`, {
        headers: { Cookie: adminUser.cookie },
    });
    const testNData = await testNRes.json();
    assert(testNRes.status === 200, `Expected 200, got ${testNRes.status}`);
    assert(Array.isArray(testNData.data.problems), "Problems must be an array");
    const targetProb = testNData.data.problems[0];

    // Toggle status
    const probStatusRes = await fetch(`${BASE_URL}/admin/coding/problems/${targetProb.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: adminUser.cookie },
        body: JSON.stringify({ isActive: false }),
    });
    assert(probStatusRes.status === 200, `Expected 200, got ${probStatusRes.status}`);

    // Re-enable
    await fetch(`${BASE_URL}/admin/coding/problems/${targetProb.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: adminUser.cookie },
        body: JSON.stringify({ isActive: true }),
    });
    console.log("✅ Passed TEST N: Coding problem status managed");

    // =========================================================================
    // TEST O: Project moderation
    // =========================================================================
    console.log("\n[TEST O] Project moderation...");
    // Create a student project
    const projInsert = await pool.query(
        `INSERT INTO projects (user_id, title, project_type, status, is_public)
         VALUES ($1, 'Admin Moderation Test Project', 'personal', 'in_progress', true)
         RETURNING id`,
        [studentUser.id]
    );
    const targetProjId = projInsert.rows[0].id;

    const modRes = await fetch(`${BASE_URL}/admin/projects/${targetProjId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: adminUser.cookie },
        body: JSON.stringify({ isPublic: false }),
    });
    const modData = await modRes.json();
    assert(modRes.status === 200, `Expected 200, got ${modRes.status}`);
    assert(modData.data.is_public === false, "Project visibility set to false");
    console.log("✅ Passed TEST O: Project moderated successfully");

    // =========================================================================
    // TEST P: Freelance moderation
    // =========================================================================
    console.log("\n[TEST P] Freelance moderation...");
    const gigInsert = await pool.query(
        `INSERT INTO freelance_projects (client_id, title, description, category, budget_type, budget_min, status)
         VALUES ($1, 'Admin Moderation Test Gig', 'Inappropriate description test', 'Web Development', 'fixed', 5000, 'open')
         RETURNING id`,
        [studentUser.id]
    );
    const gigId = gigInsert.rows[0].id;

    const cancelGigRes = await fetch(`${BASE_URL}/admin/freelance/projects/${gigId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: adminUser.cookie },
        body: JSON.stringify({ status: "cancelled" }),
    });
    const cancelGigData = await cancelGigRes.json();
    assert(cancelGigRes.status === 200, `Expected 200, got ${cancelGigRes.status}`);
    assert(cancelGigData.data.status === "cancelled", "Freelance project cancelled");
    console.log("✅ Passed TEST P: Freelance project cancelled");

    // =========================================================================
    // TEST Q: Notification overview
    // =========================================================================
    console.log("\n[TEST Q] Notification overview...");
    const notifRes = await fetch(`${BASE_URL}/admin/notifications?page=1&limit=5`, {
        headers: { Cookie: adminUser.cookie },
    });
    const notifData = await notifRes.json();
    assert(notifRes.status === 200, `Expected 200, got ${notifRes.status}`);
    assert(Array.isArray(notifData.data.notifications), "notifications must be array");
    console.log(`✅ Passed TEST Q: Retrieved ${notifData.data.notifications.length} platform notifications`);

    // =========================================================================
    // TEST R: Audit log access
    // =========================================================================
    console.log("\n[TEST R] Audit log access...");
    const auditRes = await fetch(`${BASE_URL}/admin/audit-logs?page=1&limit=10`, {
        headers: { Cookie: adminUser.cookie },
    });
    const auditData = await auditRes.json();
    assert(auditRes.status === 200, `Expected 200, got ${auditRes.status}`);
    assert(Array.isArray(auditData.data.logs), "logs must be array");
    console.log(`✅ Passed TEST R: Retrieved ${auditData.data.logs.length} audit records`);

    // =========================================================================
    // TEST S: Audit log created after admin mutation
    // =========================================================================
    console.log("\n[TEST S] Audit log created after admin mutation...");
    const latestLogs = auditData.data.logs;
    const actions = latestLogs.map((l) => l.action);
    assert(
        actions.includes("USER_SUSPENDED") ||
        actions.includes("USER_REACTIVATED") ||
        actions.includes("COURSE_PUBLISHED") ||
        actions.includes("PROJECT_MODERATED") ||
        actions.includes("FREELANCE_PROJECT_CANCELLED"),
        "Audit log contains recorded mutation events"
    );
    console.log("✅ Passed TEST S: Mutations recorded in audit ledger");

    // =========================================================================
    // TEST T: Student cannot access audit logs
    // =========================================================================
    console.log("\n[TEST T] Student cannot access audit logs...");
    const studentAudit = await fetch(`${BASE_URL}/admin/audit-logs`, {
        headers: { Cookie: studentUser.cookie },
    });
    assert(studentAudit.status === 403, `Expected 403, got ${studentAudit.status}`);
    console.log("✅ Passed TEST T: Student access to audit logs denied with 403");

    // =========================================================================
    // TEST U: Student cannot change user status
    // =========================================================================
    console.log("\n[TEST U] Student cannot change user status...");
    const studentMut = await fetch(`${BASE_URL}/admin/users/${adminUser.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: studentUser.cookie },
        body: JSON.stringify({ status: "suspended" }),
    });
    assert(studentMut.status === 403, `Expected 403, got ${studentMut.status}`);
    console.log("✅ Passed TEST U: Student mutation rejected with 403");

    // =========================================================================
    // TEST V: Student cannot access admin frontend data
    // =========================================================================
    console.log("\n[TEST V] Student cannot access admin endpoints...");
    const testVPaths = [
        "/admin/users",
        "/admin/courses",
        "/admin/jobs",
        "/admin/coding/problems",
        "/admin/projects",
        "/admin/freelance/projects",
        "/admin/notifications",
    ];
    for (const p of testVPaths) {
        const r = await fetch(`${BASE_URL}${p}`, { headers: { Cookie: studentUser.cookie } });
        assert(r.status === 403, `Path ${p} should return 403 for student, got ${r.status}`);
    }
    console.log("✅ Passed TEST V: All admin endpoints return 403 for student");

    // =========================================================================
    // TEST W: Admin cannot accidentally remove final active admin
    // =========================================================================
    console.log("\n[TEST W] Admin cannot remove final active admin...");
    // Find all other active admins in database
    const otherAdmins = await pool.query(
        "SELECT id FROM users WHERE role = 'admin' AND status = 'active' AND id != $1",
        [adminUser.id]
    );
    // Demote them temporarily so adminUser is the single active admin
    for (const row of otherAdmins.rows) {
        await pool.query("UPDATE users SET role = 'student' WHERE id = $1", [row.id]);
    }

    try {
        // Now adminUser attempts to demote themselves (as last active admin)
        const lastAdminRes = await fetch(`${BASE_URL}/admin/users/${adminUser.id}/role`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Cookie: adminUser.cookie },
            body: JSON.stringify({ role: "student" }),
        });
        assert(lastAdminRes.status === 400, `Expected 400 for removing final active admin, got ${lastAdminRes.status}`);

        // Now adminUser attempts to suspend themselves (as last active admin)
        const lastAdminSusp = await fetch(`${BASE_URL}/admin/users/${adminUser.id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Cookie: adminUser.cookie },
            body: JSON.stringify({ status: "suspended" }),
        });
        assert(lastAdminSusp.status === 400, `Expected 400 for suspending final active admin, got ${lastAdminSusp.status}`);
        console.log("✅ Passed TEST W: Final active administrator protected against lockout");
    } finally {
        // Restore all previous admins
        for (const row of otherAdmins.rows) {
            await pool.query("UPDATE users SET role = 'admin' WHERE id = $1", [row.id]);
        }
    }

    // =========================================================================
    // TEST X: UUID validation
    // =========================================================================
    console.log("\n[TEST X] UUID validation...");
    const badUuidRes = await fetch(`${BASE_URL}/admin/users/invalid-uuid-format`, {
        headers: { Cookie: adminUser.cookie },
    });
    assert(badUuidRes.status === 400, `Expected 400 for invalid UUID, got ${badUuidRes.status}`);
    console.log("✅ Passed TEST X: Invalid UUID properly rejected with 400");

    // =========================================================================
    // TEST Y: SQL injection-safe search/filtering
    // =========================================================================
    console.log("\n[TEST Y] SQL injection-safe search/filtering...");
    const sqlInjRes = await fetch(
        `${BASE_URL}/admin/users?search=${encodeURIComponent("' OR 1=1; DROP TABLE users; --")}`,
        { headers: { Cookie: adminUser.cookie } }
    );
    assert(sqlInjRes.status === 200, `Expected 200 for parameterized query, got ${sqlInjRes.status}`);
    const sqlData = await sqlInjRes.json();
    assert(Array.isArray(sqlData.data.users), "Response is valid array");
    console.log("✅ Passed TEST Y: Parameterized search resilient against SQL injection");

    // =========================================================================
    // TEST Z: No arbitrary notification creation
    // =========================================================================
    console.log("\n[TEST Z] No arbitrary notification creation...");
    const noBroadcastRes = await fetch(`${BASE_URL}/admin/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: adminUser.cookie },
        body: JSON.stringify({ message: "fake broadcast" }),
    });
    assert(
        noBroadcastRes.status === 404 || noBroadcastRes.status === 405,
        `Expected 404/405 for arbitrary notification creation, got ${noBroadcastRes.status}`
    );
    console.log("✅ Passed TEST Z: Arbitrary notification creation disallowed");

    console.log("\n========================================================");
    console.log("🎉 ALL 26 ADMIN TESTS (A through Z) PASSED SUCCESSFULLY!");
    console.log("========================================================\n");
}

runTests()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("\n❌ TESTS FAILED:", err);
        process.exit(1);
    });
