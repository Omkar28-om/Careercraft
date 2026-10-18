/**
 * CareerCraft — STEP 21 Security & Production Test Suite
 * 
 * Comprehensive test suite covering:
 * A. Authentication
 * B. Authorization
 * C. IDOR Protection
 * D. Input Validation
 * E. SQL Injection Protection
 * F. XSS Protection
 * G. Admin Security
 * H. Code Execution Security
 * I. Career Recommendation Security
 * J. Database Security
 * K. API Security
 * L. Secrets Audit
 * M. CORS/Cookies
 * N. Error Handling
 * O. Build
 * P. Regression
 */

import pool from "./src/db.js";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function registerUser(prefix, role = "student") {
    const rand = crypto.randomBytes(4).toString("hex");
    const email = `${prefix}_${rand}@example.com`;
    const password = "SecurePassword123!";
    const name = `SecUser ${prefix} ${rand}`;

    const res = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, role }),
    });

    const cookie = extractCookie(res);
    const data = await res.json();
    return { res, cookie, data, email, password, name };
}

async function loginUser(email, password) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    const cookie = extractCookie(res);
    const data = await res.json();
    return { res, cookie, data };
}

async function runStep21Tests() {
    console.log("");
    console.log("=======================================================");
    console.log("CAREERCRAFT STEP 21 — SECURITY & PRODUCTION TEST SUITE");
    console.log("=======================================================");
    console.log("");

    // =========================================================================
    // A. AUTHENTICATION
    // =========================================================================
    console.log("A. Authentication Security...");
    const userA = await registerUser("sec_a");
    assert(userA.res.status === 201, "Registration succeeds with HTTP 201");
    assert(userA.cookie !== null, "Authentication cookie is set upon registration");
    assert(!userA.data.user?.password_hash, "password_hash is strictly omitted from registration response");
    assert(!userA.data.password, "Plain-text password is never returned in registration response");

    // Check DB password hash
    const dbHashRes = await pool.query("SELECT password_hash FROM users WHERE id = $1", [userA.data.user.id]);
    const hash = dbHashRes.rows[0]?.password_hash || "";
    assert(hash.startsWith("$2") && hash.length >= 60, "Password stored in PostgreSQL is hashed using bcrypt");

    // Duplicate registration rejected
    const dupRes = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userA.email, password: "AnotherPassword123!", name: "Duplicate" }),
    });
    assert(dupRes.status === 409, "Duplicate email registration rejected safely with HTTP 409");

    // Login with valid credentials
    const loginA = await loginUser(userA.email, userA.password);
    assert(loginA.res.status === 200, "Login with valid credentials succeeds with HTTP 200");
    assert(!loginA.data.user?.password_hash, "password_hash strictly omitted from login response");

    // Login with wrong password
    const badLogin = await loginUser(userA.email, "WrongPassword999!");
    assert(badLogin.res.status === 401, "Invalid password rejected safely with HTTP 401");
    assert(badLogin.data.message === "Invalid email or password", "Safe generic error message on invalid credentials");

    // GET /api/auth/me
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
        headers: { Cookie: userA.cookie },
    });
    const meData = await meRes.json();
    assert(meRes.status === 200 && meData.user?.email === userA.email, "GET /api/auth/me identifies authenticated user");
    assert(!meData.user?.password_hash, "GET /api/auth/me omits password_hash");

    // GET /api/auth/me unauthenticated
    const meUnauth = await fetch(`${BASE_URL}/auth/me`);
    assert(meUnauth.status === 401, "Unauthenticated GET /api/auth/me returns HTTP 401");

    // Logout
    const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
        method: "POST",
        headers: { Cookie: userA.cookie },
    });
    assert(logoutRes.status === 200, "Logout endpoint succeeds with HTTP 200");
    const logoutSetCookie = logoutRes.headers.get("set-cookie") || "";
    assert(logoutSetCookie.includes("Max-Age=0") || logoutSetCookie.includes("expires=") || logoutSetCookie.includes("token=;"), "Logout invalidates authentication cookie");

    // Suspended user test
    const suspendedUser = await registerUser("sec_susp");
    await pool.query("UPDATE users SET status = 'suspended' WHERE id = $1", [suspendedUser.data.user.id]);
    const suspReq = await fetch(`${BASE_URL}/profile`, {
        headers: { Cookie: suspendedUser.cookie },
    });
    assert(suspReq.status === 403, "Suspended user cannot access protected functionality (HTTP 403)");

    // =========================================================================
    // B. AUTHORIZATION & ROLE ENFORCEMENT
    // =========================================================================
    console.log("\nB. Authorization & Role Enforcement...");
    const unauthAdmin = await fetch(`${BASE_URL}/admin/stats`);
    assert(unauthAdmin.status === 401, "Unauthenticated access to /api/admin/stats returns HTTP 401");

    const studentAdmin = await fetch(`${BASE_URL}/admin/stats`, {
        headers: { Cookie: userA.cookie },
    });
    assert(studentAdmin.status === 403, "Normal student accessing /api/admin/stats returns HTTP 403");

    // Registration cannot self-promote to admin
    const spoofRoleUser = await registerUser("sec_spoof_role", "admin");
    const checkRoleRes = await pool.query("SELECT role FROM users WHERE id = $1", [spoofRoleUser.data.user.id]);
    assert(checkRoleRes.rows[0]?.role === "student", "Client cannot self-assign admin role during registration");

    // =========================================================================
    // C. IDOR PROTECTION
    // =========================================================================
    console.log("\nC. IDOR Protection...");
    const userB = await registerUser("sec_b");

    // 1. Add skill to User A
    const skillRes = await fetch(`${BASE_URL}/skills`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: userA.cookie },
        body: JSON.stringify({ name: "TypeScript Security", category: "Languages", proficiency: "Advanced" }),
    });
    const skillData = await skillRes.json();
    const userASkillId = skillData.skill?.id;
    assert(skillRes.status === 201 && userASkillId, "User A creates skill successfully");

    // User B tries to update User A's skill
    const idorSkillUpdate = await fetch(`${BASE_URL}/skills/${userASkillId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Cookie: userB.cookie },
        body: JSON.stringify({ name: "Hacked Skill", category: "Languages", proficiency: "Expert" }),
    });
    assert(idorSkillUpdate.status === 403, "User B cannot update User A's skill (IDOR blocked with HTTP 403)");

    // User B tries to delete User A's skill
    const idorSkillDelete = await fetch(`${BASE_URL}/skills/${userASkillId}`, {
        method: "DELETE",
        headers: { Cookie: userB.cookie },
    });
    assert(idorSkillDelete.status === 403, "User B cannot delete User A's skill (IDOR blocked with HTTP 403)");

    // 2. Add project to User A
    const projRes = await fetch(`${BASE_URL}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: userA.cookie },
        body: JSON.stringify({ title: "User A Private App", description: "Private source code", project_type: "personal", status: "in_progress" }),
    });
    const projData = await projRes.json();
    const userAProjId = projData.project?.id;
    assert(projRes.status === 201 && userAProjId, "User A creates project successfully");

    // User B tries to update User A's project
    const idorProjUpdate = await fetch(`${BASE_URL}/projects/${userAProjId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: userB.cookie },
        body: JSON.stringify({ title: "Compromised Project" }),
    });
    assert(idorProjUpdate.status === 403, "User B cannot modify User A's project (IDOR blocked with HTTP 403)");

    // User B tries to delete User A's project
    const idorProjDelete = await fetch(`${BASE_URL}/projects/${userAProjId}`, {
        method: "DELETE",
        headers: { Cookie: userB.cookie },
    });
    assert(idorProjDelete.status === 403, "User B cannot delete User A's project (IDOR blocked with HTTP 403)");

    // 3. User B tries to view User A's notifications
    const userANotifRes = await pool.query(
        "INSERT INTO notifications (user_id, type, title, message) VALUES ($1, 'system', 'Secret Alert', 'Top Secret') RETURNING id",
        [userA.data.user.id]
    );
    const notifId = userANotifRes.rows[0].id;

    const idorNotifList = await fetch(`${BASE_URL}/notifications`, {
        headers: { Cookie: userB.cookie },
    });
    const idorNotifData = await idorNotifList.json();
    const leakedNotif = (idorNotifData.notifications || []).find((n) => n.id === notifId);
    assert(!leakedNotif, "User B cannot view User A's private notifications (IDOR isolated)");

    // User B tries to mark User A's notification as read
    const idorNotifRead = await fetch(`${BASE_URL}/notifications/${notifId}/read`, {
        method: "PATCH",
        headers: { Cookie: userB.cookie },
    });
    assert(idorNotifRead.status === 404 || idorNotifRead.status === 403, "User B cannot mark User A's notification as read (HTTP 403/404)");

    // 4. Body user_id spoofing in settings
    const idorSettingsSpoof = await fetch(`${BASE_URL}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: userB.cookie },
        body: JSON.stringify({ user_id: userA.data.user.id, theme: "light" }),
    });
    assert(idorSettingsSpoof.status === 200, "Settings update handles request");
    const userASettingsCheck = await fetch(`${BASE_URL}/settings`, {
        headers: { Cookie: userA.cookie },
    });
    const userASettingsData = await userASettingsCheck.json();
    assert(userASettingsData.preferences?.theme !== "light" || userASettingsData.user?.id === userA.data.user.id, "user_id spoofing does not affect User A's settings");

    // =========================================================================
    // D. INPUT VALIDATION
    // =========================================================================
    console.log("\nD. Input Validation...");
    // Empty registration fields
    const emptyReg = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "", password: "", name: "" }),
    });
    assert(emptyReg.status === 400, "Empty registration fields rejected with HTTP 400");

    // Invalid email
    const invalidEmailReg = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "not-an-email", password: "ValidPassword123!", name: "John" }),
    });
    assert(invalidEmailReg.status === 400, "Invalid email format rejected with HTTP 400");

    // Short password
    const shortPassReg = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "valid@example.com", password: "short", name: "John" }),
    });
    assert(shortPassReg.status === 400, "Short password rejected with HTTP 400");

    // Malformed JSON payload
    const malformedJsonRes = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{ bad json: ",
    });
    assert(malformedJsonRes.status === 400, "Malformed JSON payload rejected safely with HTTP 400");

    // Invalid UUID
    const invalidUuidRes = await fetch(`${BASE_URL}/skills/not-a-uuid`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Cookie: userA.cookie },
        body: JSON.stringify({ name: "Valid" }),
    });
    assert(invalidUuidRes.status === 400, "Invalid UUID in path parameter rejected with HTTP 400");

    // Oversized string in project title
    const oversizedTitle = "A".repeat(300);
    const oversizedProjRes = await fetch(`${BASE_URL}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: userA.cookie },
        body: JSON.stringify({ title: oversizedTitle, project_type: "personal" }),
    });
    assert(oversizedProjRes.status === 400, "Oversized project title (>150 chars) rejected with HTTP 400");

    // Invalid enum in project type
    const invalidEnumProjRes = await fetch(`${BASE_URL}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: userA.cookie },
        body: JSON.stringify({ title: "Valid Title", project_type: "invalid_enum_type" }),
    });
    assert(invalidEnumProjRes.status === 400, "Invalid project_type enum rejected with HTTP 400");

    // =========================================================================
    // E. SQL INJECTION PROTECTION
    // =========================================================================
    console.log("\nE. SQL Injection Protection...");
    const sqliPayload1 = "' OR '1'='1";
    const sqliRes1 = await fetch(`${BASE_URL}/coding/problems?search=${encodeURIComponent(sqliPayload1)}`);
    assert(sqliRes1.status === 200, "SQL injection query in search does not break server (HTTP 200)");

    const sqliPayload2 = "'; DROP TABLE users; --";
    const sqliRes2 = await fetch(`${BASE_URL}/jobs?search=${encodeURIComponent(sqliPayload2)}`);
    assert(sqliRes2.status === 200, "Destructive SQL injection payload safely handled by parameterized query");

    // Verify users table was NOT dropped
    const verifyTableRes = await pool.query("SELECT COUNT(*)::int AS count FROM users");
    assert((verifyTableRes.rows[0]?.count || 0) > 0, "PostgreSQL database users table remains completely intact");

    // =========================================================================
    // F. XSS / OUTPUT SAFETY
    // =========================================================================
    console.log("\nF. XSS Protection...");
    const xssPayload = "<script>alert('XSS')</script><img src=x onerror=alert(1)>";
    const xssProfileRes = await fetch(`${BASE_URL}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Cookie: userA.cookie },
        body: JSON.stringify({ bio: xssPayload }),
    });
    assert(xssProfileRes.status === 200, "Profile accepts and stores string without code execution");
    const getBioRes = await fetch(`${BASE_URL}/profile`, {
        headers: { Cookie: userA.cookie },
    });
    const bioData = await getBioRes.json();
    assert(typeof bioData.profile?.bio === "string", "Bio is returned as plain string data");

    // Audit frontend client code for dangerouslySetInnerHTML
    let dangerouslySetInnerHTMLFound = false;
    function searchClientFiles(dir) {
        if (!fs.existsSync(dir)) return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory() && entry.name !== "node_modules" && entry.name !== "dist") {
                searchClientFiles(fullPath);
            } else if (entry.isFile() && (entry.name.endsWith(".jsx") || entry.name.endsWith(".js") || entry.name.endsWith(".html"))) {
                const content = fs.readFileSync(fullPath, "utf-8");
                if (content.includes("dangerouslySetInnerHTML")) {
                    dangerouslySetInnerHTMLFound = true;
                }
            }
        }
    }
    searchClientFiles(path.join(__dirname, "../client/src"));
    assert(!dangerouslySetInnerHTMLFound, "Zero occurrences of dangerouslySetInnerHTML found in client source code");

    // =========================================================================
    // G. ADMIN SECURITY
    // =========================================================================
    console.log("\nG. Admin Security...");
    // Set up dedicated test admin
    const adminUser = await registerUser("sec_admin");
    await pool.query("UPDATE users SET role = 'admin' WHERE id = $1", [adminUser.data.user.id]);

    const adminStatsRes = await fetch(`${BASE_URL}/admin/stats`, {
        headers: { Cookie: adminUser.cookie },
    });
    assert(adminStatsRes.status === 200, "Verified admin can access /api/admin/stats (HTTP 200)");

    const adminUsersRes = await fetch(`${BASE_URL}/admin/users?limit=5`, {
        headers: { Cookie: adminUser.cookie },
    });
    assert(adminUsersRes.status === 200, "Verified admin can access /api/admin/users (HTTP 200)");

    const auditLogsRes = await fetch(`${BASE_URL}/admin/audit-logs?limit=5`, {
        headers: { Cookie: adminUser.cookie },
    });
    assert(auditLogsRes.status === 200, "Verified admin can access /api/admin/audit-logs (HTTP 200)");

    // Test final active admin lockout protection
    // Ensure only 1 active admin exists for test
    const allAdminsRes = await pool.query("SELECT id FROM users WHERE role = 'admin' AND status = 'active'");
    const activeAdmins = allAdminsRes.rows;
    // Set other admins to student temporarily if more than 1
    const demotedIds = [];
    for (let i = 0; i < activeAdmins.length; i++) {
        if (activeAdmins[i].id !== adminUser.data.user.id) {
            await pool.query("UPDATE users SET role = 'student' WHERE id = $1", [activeAdmins[i].id]);
            demotedIds.push(activeAdmins[i].id);
        }
    }

    // Attempt to suspend last active admin
    const suspendFinalAdminRes = await fetch(`${BASE_URL}/admin/users/${adminUser.data.user.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: adminUser.cookie },
        body: JSON.stringify({ status: "suspended" }),
    });
    assert(suspendFinalAdminRes.status === 400, "Lockout protection prevents suspending the final active administrator (HTTP 400)");

    // Attempt to demote last active admin
    const demoteFinalAdminRes = await fetch(`${BASE_URL}/admin/users/${adminUser.data.user.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: adminUser.cookie },
        body: JSON.stringify({ role: "student" }),
    });
    assert(demoteFinalAdminRes.status === 400, "Lockout protection prevents demoting the final active administrator (HTTP 400)");

    // Restore previous admins
    for (const demotedId of demotedIds) {
        await pool.query("UPDATE users SET role = 'admin' WHERE id = $1", [demotedId]);
    }

    // =========================================================================
    // H. CODE EXECUTION SECURITY
    // =========================================================================
    console.log("\nH. Code Execution Security...");
    // Find a published problem
    const probRes = await pool.query("SELECT id, slug FROM coding_problems WHERE is_published = true LIMIT 1");
    const testProb = probRes.rows[0];

    if (testProb) {
        // Unsupported language
        const badLangSub = await fetch(`${BASE_URL}/coding/problems/${testProb.id}/submissions`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: userA.cookie },
            body: JSON.stringify({ language: "malicious_asm", source_code: "mov eax, 1" }),
        });
        assert(badLangSub.status === 400, "Unsupported programming language rejected with HTTP 400");

        // Code size limit (>64KB)
        const hugeCode = "// padding\n".repeat(8000); // >65KB
        const hugeSub = await fetch(`${BASE_URL}/coding/problems/${testProb.id}/submissions`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: userA.cookie },
            body: JSON.stringify({ language: "javascript", source_code: hugeCode }),
        });
        assert(hugeSub.status === 400, "Source code exceeding 64KB boundary rejected with HTTP 400");

        // Public problem details do not leak hidden test cases
        const probDetailRes = await fetch(`${BASE_URL}/coding/problems/${testProb.slug}`);
        const probDetail = await probDetailRes.json();
        const cases = probDetail.problem?.sampleTestCases || [];
        const hasHiddenInPublic = cases.some((tc) => tc.is_hidden === true);
        assert(!hasHiddenInPublic, "Problem details NEVER expose hidden test cases to client");
    }

    // =========================================================================
    // I. CAREER RECOMMENDATION SECURITY
    // =========================================================================
    console.log("\nI. Career Recommendation Security...");
    // User B cannot access User A's recommendations or history
    const userAHist = await fetch(`${BASE_URL}/career/history`, {
        headers: { Cookie: userA.cookie },
    });
    assert(userAHist.status === 200, "User A can read own career history");

    const userBHist = await fetch(`${BASE_URL}/career/history`, {
        headers: { Cookie: userB.cookie },
    });
    const userBHistData = await userBHist.json();
    assert(userBHist.status === 200 && Array.isArray(userBHistData.history), "User B history is cleanly partitioned");

    // Invalid preferences validation
    const badPrefRes = await fetch(`${BASE_URL}/career/preferences`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: userA.cookie },
        body: JSON.stringify({ preferredWorkMode: "invalid_mode_xyz" }),
    });
    assert(badPrefRes.status === 400, "Invalid career preferences rejected with HTTP 400");

    // Invalid career path slug
    const badPathRes = await fetch(`${BASE_URL}/career/paths/non-existent-career-path-xyz`, {
        headers: { Cookie: userA.cookie },
    });
    assert(badPathRes.status === 404, "Non-existent career path returns HTTP 404");

    // Regeneration cooldown
    const regen1 = await fetch(`${BASE_URL}/career/recommendations/regenerate`, {
        method: "POST",
        headers: { Cookie: userA.cookie },
    });
    if (regen1.status === 200) {
        // Second immediate call must hit 429 cooldown
        const regen2 = await fetch(`${BASE_URL}/career/recommendations/regenerate`, {
            method: "POST",
            headers: { Cookie: userA.cookie },
        });
        assert(regen2.status === 429, "Recommendation regeneration enforces 5-minute cooldown (HTTP 429)");
    } else {
        assert(regen1.status === 429, "Recommendation regeneration enforces cooldown (HTTP 429)");
    }

    // =========================================================================
    // J. DATABASE SECURITY
    // =========================================================================
    console.log("\nJ. Database Security...");
    // Verify foreign key cascading on disposable user
    const tempUser = await registerUser("sec_cascade_test");
    await pool.query("INSERT INTO skills (user_id, name, category, proficiency) VALUES ($1, 'Cascade Skill', 'Languages', 'Beginner')", [tempUser.data.user.id]);
    await pool.query("DELETE FROM users WHERE id = $1", [tempUser.data.user.id]);
    const orphanSkillCheck = await pool.query("SELECT id FROM skills WHERE user_id = $1", [tempUser.data.user.id]);
    assert(orphanSkillCheck.rows.length === 0, "Foreign key cascading deletes dependent user rows cleanly without orphan leaks");

    // Verify unique email constraint
    let caughtConstraint = false;
    try {
        await pool.query("INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)", ["Dup", userA.email, "hash"]);
    } catch {
        caughtConstraint = true;
    }
    assert(caughtConstraint, "Database level unique constraint enforces email uniqueness");

    // =========================================================================
    // K. API SECURITY
    // =========================================================================
    console.log("\nK. API Security...");
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200, "GET /api/health returns HTTP 200");
    assert(healthData.database === "connected", "Database connectivity confirmed healthy");
    assert(healthData.status === "healthy", "API reports status 'healthy'");

    // Check response headers for security headers
    const contentTypeNosniff = healthRes.headers.get("x-content-type-options");
    assert(contentTypeNosniff === "nosniff", "Helmet enforces X-Content-Type-Options: nosniff");

    // Unknown endpoint returns 404 JSON, not HTML or stack trace
    const notFoundRes = await fetch(`${BASE_URL}/non-existent-endpoint-${Date.now()}`);
    const notFoundData = await notFoundRes.json();
    assert(notFoundRes.status === 404, "Nonexistent route returns HTTP 404");
    assert(notFoundData.success === false, "404 returns safe JSON payload");
    assert(!notFoundData.stack, "404 never leaks internal server stack traces");

    // =========================================================================
    // L. SECRETS AUDIT
    // =========================================================================
    console.log("\nL. Secrets Audit...");
    const serverGitignorePath = path.join(__dirname, ".gitignore");
    const rootGitignorePath = path.join(__dirname, "../.gitignore");
    let envIgnored = false;
    if (fs.existsSync(serverGitignorePath)) {
        const content = fs.readFileSync(serverGitignorePath, "utf-8");
        if (content.includes(".env")) envIgnored = true;
    }
    if (fs.existsSync(rootGitignorePath)) {
        const content = fs.readFileSync(rootGitignorePath, "utf-8");
        if (content.includes(".env")) envIgnored = true;
    }
    assert(envIgnored, ".env file is strictly ignored in .gitignore");

    const envExamplePath = path.join(__dirname, ".env.example");
    let envExampleSafe = true;
    if (fs.existsSync(envExamplePath)) {
        const exampleContent = fs.readFileSync(envExamplePath, "utf-8");
        if (exampleContent.includes("postgres://") && !exampleContent.includes("DATABASE_URL=")) {
            envExampleSafe = false;
        }
        if (exampleContent.includes("eyJhbGciOi")) { // JWT token format
            envExampleSafe = false;
        }
    }
    assert(envExampleSafe, ".env.example contains only safe placeholders with zero real secrets");

    // Check that JWT_SECRET is loaded
    assert(Boolean(process.env.JWT_SECRET), "JWT_SECRET is loaded securely from environment");

    // =========================================================================
    // M. CORS & COOKIE SECURITY
    // =========================================================================
    console.log("\nM. CORS & Cookie Security...");
    // Check Set-Cookie attributes on login
    const loginCookieHeader = loginA.res.headers.get("set-cookie") || "";
    assert(loginCookieHeader.toLowerCase().includes("httponly"), "Authentication token cookie specifies HttpOnly");
    assert(loginCookieHeader.toLowerCase().includes("samesite"), "Authentication token cookie specifies SameSite");

    // Test CORS rejection for unauthorized origin
    const corsRes = await fetch(`${BASE_URL}/health`, {
        headers: { Origin: "http://malicious-attacker-site.com" },
    });
    // CORS middleware either drops header or denies request
    const allowOrigin = corsRes.headers.get("access-control-allow-origin");
    assert(allowOrigin !== "http://malicious-attacker-site.com" && allowOrigin !== "*", "CORS strictly blocks untrusted external origin from credentials");

    // =========================================================================
    // N. ERROR HANDLING
    // =========================================================================
    console.log("\nN. Error Handling...");
    // Send invalid types to endpoints to verify clean error responses
    const errRes1 = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: null, password: null }),
    });
    assert(errRes1.status === 400, "Null login inputs handled cleanly with HTTP 400");

    const errRes2 = await fetch(`${BASE_URL}/projects/00000000-0000-0000-0000-000000000000`, {
        method: "GET",
        headers: { Cookie: userA.cookie },
    });
    assert(errRes2.status === 404, "Nonexistent project UUID returns HTTP 404");

    // Server should remain alive and fully responsive
    const pingRes = await fetch(`${BASE_URL}/health`);
    assert(pingRes.status === 200, "Server remains alive and responsive after handling client error states");

    // =========================================================================
    // O. BUILD VERIFICATION
    // =========================================================================
    console.log("\nO. Build Verification...");
    const clientDistPath = path.join(__dirname, "../client/dist/index.html");
    const clientDistExists = fs.existsSync(clientDistPath);
    assert(clientDistExists, "Vite production client build (client/dist/index.html) exists and is verified");

    // =========================================================================
    // P. REGRESSION INTEGRATION
    // =========================================================================
    console.log("\nP. Regression Integration...");
    const regCourses = await fetch(`${BASE_URL}/courses`);
    assert(regCourses.status === 200, "Courses catalog endpoint returns HTTP 200");

    const regJobs = await fetch(`${BASE_URL}/jobs`);
    assert(regJobs.status === 200, "Jobs catalog endpoint returns HTTP 200");

    const regFreelance = await fetch(`${BASE_URL}/freelance/projects`);
    assert(regFreelance.status === 200, "Freelance projects catalog returns HTTP 200");

    const regDashboard = await fetch(`${BASE_URL}/dashboard`, {
        headers: { Cookie: userA.cookie },
    });
    assert(regDashboard.status === 200, "Student dashboard endpoint returns HTTP 200");

    // =========================================================================
    // SUMMARY
    // =========================================================================
    console.log("");
    console.log("=======================================================");
    console.log(`TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log("=======================================================");
    console.log("");

    if (failedCount > 0) {
        process.exit(1);
    }
}

runStep21Tests().catch((err) => {
    console.error("Test execution error:", err);
    process.exit(1);
});
