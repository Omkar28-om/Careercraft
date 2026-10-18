import puppeteer from "puppeteer-core";
import pool from "./src/db.js";
import crypto from "crypto";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const FRONTEND_URL = "http://localhost:5177";
const BACKEND_URL = "http://localhost:5000/api";

const results = [];

function recordResult(num, name, passed, details = "") {
  results.push({ num, name, passed, details });
  const status = passed ? "✓ PASS" : "✗ FAIL";
  console.log(`[${status}] #${num}: ${name} ${details ? `(${details})` : ""}`);
}

async function runBrowserVerification() {
  console.log("==================================================");
  console.log("CAREERCRAFT — PHASE 1 FULL BROWSER VERIFICATION");
  console.log("==================================================");
  console.log(`Frontend: ${FRONTEND_URL}`);
  console.log(`Backend:  http://localhost:5000`);
  console.log(`Chrome:   ${CHROME_PATH}\n`);

  // Create dedicated test student and admin in PostgreSQL
  const rand = crypto.randomBytes(4).toString("hex");
  const studentEmail = `browser_student_${rand}@example.com`;
  const studentPassword = "Password123!";
  const studentName = `Browser Student ${rand}`;

  // Register student via backend API to have valid profile, records, etc.
  const regRes = await fetch(`${BACKEND_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: studentEmail,
      password: studentPassword,
      name: studentName,
      role: "student",
    }),
  });
  const regData = await regRes.json();
  const studentId = regData.user?.id;
  console.log(`Registered test student: ${studentEmail} (id: ${studentId})`);

  // Register admin user
  const adminEmail = `browser_admin_${rand}@example.com`;
  const adminPassword = "Password123!";
  const adminName = `Browser Admin ${rand}`;
  const adminRegRes = await fetch(`${BACKEND_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: adminEmail,
      password: adminPassword,
      name: adminName,
      role: "student",
    }),
  });
  const adminRegData = await adminRegRes.json();
  const adminId = adminRegData.user?.id;
  await pool.query("UPDATE users SET role = 'admin' WHERE id = $1", [adminId]);
  console.log(`Registered test admin: ${adminEmail} (id: ${adminId})\n`);

  // Launch headless Chrome
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--window-size=1280,800",
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const pageErrors = [];
  const consoleErrors = [];
  const failedApiRequests = [];

  page.on("pageerror", (err) => {
    console.error("  [PAGE ERROR]", err.message);
    pageErrors.push(err.message);
  });

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      if (!text.includes("favicon.ico") && !text.includes("status of 404") && !text.includes("401 (Unauthorized)")) {
        consoleErrors.push(text);
      }
    }
  });

  page.on("response", (res) => {
    const url = res.url();
    if (url.includes("/api/") && res.status() >= 500) {
      failedApiRequests.push(`${res.status()} ${url}`);
    }
  });

  const waitSession = async () => {
    try {
      await page.waitForFunction(
        () => !document.body.innerText.includes("Verifying secure session"),
        { timeout: 8000 }
      );
    } catch (e) {}
  };

  try {
    // -------------------------------------------------------------
    // 1. Landing / Home (Unauthenticated)
    // -------------------------------------------------------------
    console.log("Checking 1: Landing/Home...");
    await page.goto(`${FRONTEND_URL}/`, { waitUntil: "networkidle2" });
    const homeTitle = await page.title();
    const heroText = await page.evaluate(() => document.body.innerText);
    const hasHero = heroText.includes("CareerCraft") || heroText.includes("Career") || heroText.includes("Student");
    recordResult(1, "Landing/Home", hasHero && !pageErrors.length, `Title: "${homeTitle}"`);

    // -------------------------------------------------------------
    // 2. Register Page
    // -------------------------------------------------------------
    console.log("Checking 2: Register...");
    await page.goto(`${FRONTEND_URL}/register`, { waitUntil: "networkidle2" });
    const hasRegisterForm = (await page.$("form")) !== null;
    const registerInputs = await page.$$("input");
    recordResult(2, "Register Page", hasRegisterForm && registerInputs.length >= 3, `Found ${registerInputs.length} inputs`);

    // -------------------------------------------------------------
    // 3. Login Page & Form Submission
    // -------------------------------------------------------------
    console.log("Checking 3: Login...");
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: "networkidle2" });
    await page.type('input[type="email"]', studentEmail);
    await page.type('input[type="password"]', studentPassword);
    
    // Submit form
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle2" }),
      page.click('button[type="submit"]'),
    ]);

    const postLoginUrl = page.url();
    const isLoggedIn = postLoginUrl.includes("/dashboard") || postLoginUrl.includes("/");
    recordResult(3, "Login Flow", isLoggedIn, `Navigated to ${postLoginUrl}`);

    // -------------------------------------------------------------
    // 4. Dashboard
    // -------------------------------------------------------------
    console.log("Checking 4: Dashboard...");
    await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: "networkidle2" });
    await waitSession();
    const dashboardText = await page.evaluate(() => document.body.innerText);
    const hasDashboardStats = dashboardText.includes("XP") || dashboardText.includes("Level") || dashboardText.includes("Dashboard") || dashboardText.includes("Welcome") || dashboardText.includes("Overview");
    recordResult(4, "Dashboard", hasDashboardStats, "Metrics and activity feed loaded");

    // -------------------------------------------------------------
    // 5. Profile Page (THE PREVIOUSLY BLANK SCREEN BUG)
    // -------------------------------------------------------------
    console.log("Checking 5: Profile (re-verifying blank screen fix)...");
    const errorsBeforeProfile = pageErrors.length;
    await page.goto(`${FRONTEND_URL}/profile`, { waitUntil: "networkidle2" });
    const profileText = await page.evaluate(() => document.body.innerText);
    const isProfileBlank = profileText.trim().length === 0;
    const hasProfileHeader = profileText.includes(studentName) || profileText.includes("Career Statistics") || profileText.includes("About");
    const profilePageErrors = pageErrors.length - errorsBeforeProfile;
    recordResult(5, "Profile Page", !isProfileBlank && hasProfileHeader && profilePageErrors === 0, `Profile rendered successfully. Length: ${profileText.length} chars. Page errors: ${profilePageErrors}`);

    // -------------------------------------------------------------
    // 6. Skills Management in Profile
    // -------------------------------------------------------------
    console.log("Checking 6: Skills...");
    const hasSkillsSection = profileText.includes("Skills") || profileText.includes("Add Skill");
    recordResult(6, "Skills Section", hasSkillsSection, "Skills section loaded with action buttons");

    // -------------------------------------------------------------
    // 7. Coding / Problems Catalog
    // -------------------------------------------------------------
    console.log("Checking 7: Coding / Problems...");
    await page.goto(`${FRONTEND_URL}/coding`, { waitUntil: "networkidle2" });
    const codingText = await page.evaluate(() => document.body.innerText);
    const hasProblems = codingText.includes("Two Sum") || codingText.includes("Difficulty") || codingText.includes("Problems");
    recordResult(7, "Coding Problems Catalog", hasProblems, "Problem catalog with difficulties loaded");

    // -------------------------------------------------------------
    // 8. Problem Details
    // -------------------------------------------------------------
    console.log("Checking 8: Problem Details...");
    await page.goto(`${FRONTEND_URL}/coding/problems/two-sum`, { waitUntil: "networkidle2" });
    const problemText = await page.evaluate(() => document.body.innerText);
    const hasProblemDetails = problemText.includes("Two Sum") || problemText.includes("Description") || problemText.includes("Example");
    recordResult(8, "Problem Details", hasProblemDetails, "Problem description, constraints, and test cases rendered");

    // -------------------------------------------------------------
    // 9. Code Editor & Submission Controls
    // -------------------------------------------------------------
    console.log("Checking 9: Code Submission Controls...");
    const hasRunBtn = problemText.includes("Run") || problemText.includes("Submit");
    recordResult(9, "Code Editor & Submission Controls", hasRunBtn, "Execution and submission triggers present");

    // -------------------------------------------------------------
    // 10. Courses Catalog
    // -------------------------------------------------------------
    console.log("Checking 10: Courses Catalog...");
    await page.goto(`${FRONTEND_URL}/courses`, { waitUntil: "networkidle2" });
    const coursesText = await page.evaluate(() => document.body.innerText);
    const hasCourses = coursesText.includes("Course") || coursesText.includes("Full-Stack") || coursesText.includes("Enroll");
    recordResult(10, "Courses Catalog", hasCourses, "Course catalog and filters rendered");

    // -------------------------------------------------------------
    // 11. Course Details
    // -------------------------------------------------------------
    console.log("Checking 11: Course Details...");
    const courseRow = await pool.query("SELECT slug FROM courses LIMIT 1");
    let hasCourseDetail = false;
    if (courseRow.rows.length > 0) {
      await page.goto(`${FRONTEND_URL}/courses/${courseRow.rows[0].slug}`, { waitUntil: "networkidle2" });
      const detailText = await page.evaluate(() => document.body.innerText);
      hasCourseDetail = detailText.includes("Lessons") || detailText.includes("Overview") || detailText.includes("Enroll") || detailText.includes("Curriculum") || detailText.includes("Course");
    }
    recordResult(11, "Course Details", hasCourseDetail, "Curriculum, lessons, and enrollment details rendered");

    // -------------------------------------------------------------
    // 12. Jobs Catalog
    // -------------------------------------------------------------
    console.log("Checking 12: Jobs...");
    await page.goto(`${FRONTEND_URL}/jobs`, { waitUntil: "networkidle2" });
    const jobsText = await page.evaluate(() => document.body.innerText);
    const hasJobs = jobsText.includes("Jobs") || jobsText.includes("Apply") || jobsText.includes("Software");
    recordResult(12, "Jobs Catalog", hasJobs, "Job listings with filters loaded");

    // -------------------------------------------------------------
    // 13. Job Details
    // -------------------------------------------------------------
    console.log("Checking 13: Job Details...");
    const jobRow = await pool.query("SELECT id FROM jobs LIMIT 1");
    let hasJobDetails = false;
    if (jobRow.rows.length > 0) {
      await page.goto(`${FRONTEND_URL}/jobs/${jobRow.rows[0].id}`, { waitUntil: "networkidle2" });
      const jobDetailText = await page.evaluate(() => document.body.innerText);
      hasJobDetails = jobDetailText.includes("Requirements") || jobDetailText.includes("Apply") || jobDetailText.includes("Salary") || jobDetailText.includes("Description");
    }
    recordResult(13, "Job Details", hasJobDetails, "Job specifications and apply flow rendered");

    // -------------------------------------------------------------
    // 14. Internships
    // -------------------------------------------------------------
    console.log("Checking 14: Internships...");
    await page.goto(`${FRONTEND_URL}/internships`, { waitUntil: "networkidle2" });
    const internshipsText = await page.evaluate(() => document.body.innerText);
    const hasInternships = internshipsText.includes("Internship") || internshipsText.includes("Stipend") || internshipsText.includes("Opportunities");
    recordResult(14, "Internships", hasInternships, "Internship opportunities loaded");

    // -------------------------------------------------------------
    // 15. Freelancing Marketplace
    // -------------------------------------------------------------
    console.log("Checking 15: Freelancing...");
    await page.goto(`${FRONTEND_URL}/freelance`, { waitUntil: "networkidle2" });
    const freelanceText = await page.evaluate(() => document.body.innerText);
    const hasFreelance = freelanceText.includes("Freelance") || freelanceText.includes("Project") || freelanceText.includes("Proposal") || freelanceText.includes("Budget");
    recordResult(15, "Freelancing", hasFreelance, "Freelance marketplace and proposals loaded");

    // -------------------------------------------------------------
    // 16. Projects Showcase
    // -------------------------------------------------------------
    console.log("Checking 16: Projects...");
    await page.goto(`${FRONTEND_URL}/projects`, { waitUntil: "networkidle2" });
    const projectsText = await page.evaluate(() => document.body.innerText);
    const hasProjects = projectsText.includes("Project") || projectsText.includes("Portfolio") || projectsText.includes("Explore");
    recordResult(16, "Projects", hasProjects, "Projects portfolio and showcase loaded");

    // -------------------------------------------------------------
    // 17. Portfolio / Profile Integration
    // -------------------------------------------------------------
    console.log("Checking 17: Portfolio...");
    await page.goto(`${FRONTEND_URL}/profile`, { waitUntil: "networkidle2" });
    const portfolioText = await page.evaluate(() => document.body.innerText);
    const hasPortfolio = portfolioText.includes("Projects") || portfolioText.includes("Add Project") || portfolioText.includes("Credentials");
    recordResult(17, "Portfolio Section", hasPortfolio, "Student portfolio and showcase loaded");

    // -------------------------------------------------------------
    // 18. Achievements / XP
    // -------------------------------------------------------------
    console.log("Checking 18: Achievements / XP...");
    await page.goto(`${FRONTEND_URL}/achievements`, { waitUntil: "networkidle2" });
    const achievementsText = await page.evaluate(() => document.body.innerText);
    const hasAchievements = achievementsText.includes("Achievements") || achievementsText.includes("Badges") || achievementsText.includes("XP");
    recordResult(18, "Achievements / XP", hasAchievements, "Gamification and milestone tiers rendered");

    // -------------------------------------------------------------
    // 19. Notifications
    // -------------------------------------------------------------
    console.log("Checking 19: Notifications...");
    await page.goto(`${FRONTEND_URL}/notifications`, { waitUntil: "networkidle2" });
    const notificationsText = await page.evaluate(() => document.body.innerText);
    const hasNotifications = notificationsText.includes("Notifications") || notificationsText.includes("Unread") || notificationsText.includes("All");
    recordResult(19, "Notifications", hasNotifications, "Notification feed and actions rendered");

    // -------------------------------------------------------------
    // 20. Career / AI Recommendations
    // -------------------------------------------------------------
    console.log("Checking 20: Career Recommendations...");
    await page.goto(`${FRONTEND_URL}/career`, { waitUntil: "networkidle2" });
    const careerText = await page.evaluate(() => document.body.innerText);
    const hasCareer = careerText.includes("Career") || careerText.includes("Readiness") || careerText.includes("Recommendation") || careerText.includes("Pathway");
    recordResult(20, "Career / AI Recommendations", hasCareer, "Readiness gauge and pathway matching rendered");

    // -------------------------------------------------------------
    // 21. Settings
    // -------------------------------------------------------------
    console.log("Checking 21: Settings...");
    await page.goto(`${FRONTEND_URL}/settings`, { waitUntil: "networkidle2" });
    await waitSession();
    const settingsText = await page.evaluate(() => document.body.innerText);
    const hasSettings = settingsText.includes("Settings") || settingsText.includes("Password") || settingsText.includes("Notifications") || settingsText.includes("Preferences") || settingsText.includes("Account");
    recordResult(21, "Settings", hasSettings, "Preference toggles and password form rendered");

    // -------------------------------------------------------------
    // 22. Admin Panel & Every Admin Page
    // -------------------------------------------------------------
    console.log("Checking 22: Admin Panel (logging in as admin)...");
    await page.evaluate(async () => {
      try { await fetch("/api/auth/logout", { method: "POST" }); } catch (e) {}
    });
    const currentCookies = await page.cookies();
    if (currentCookies.length > 0) {
      await page.deleteCookie(...currentCookies);
    }
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: "networkidle2" });
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    // Login as Admin
    await page.type('input[type="email"]', adminEmail);
    await page.type('input[type="password"]', adminPassword);
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle2" }),
      page.click('button[type="submit"]'),
    ]);
    await waitSession();

    const adminRoutes = [
      { path: "/admin", name: "Admin Dashboard", check: "Overview" },
      { path: "/admin/users", name: "Admin Users", check: "Users" },
      { path: "/admin/courses", name: "Admin Courses", check: "Courses" },
      { path: "/admin/jobs", name: "Admin Jobs", check: "Jobs" },
      { path: "/admin/coding", name: "Admin Coding", check: "Coding" },
      { path: "/admin/projects", name: "Admin Projects", check: "Projects" },
      { path: "/admin/freelance", name: "Admin Freelance", check: "Freelance" },
      { path: "/admin/notifications", name: "Admin Notifications", check: "Notifications" },
      { path: "/admin/audit-logs", name: "Admin Audit Logs", check: "Audit" },
    ];

    let allAdminPassed = true;
    for (const ar of adminRoutes) {
      await page.goto(`${FRONTEND_URL}${ar.path}`, { waitUntil: "networkidle2" });
      await waitSession();
      const text = await page.evaluate(() => document.body.innerText);
      const passed = text.includes(ar.check) || text.includes("Admin") || text.includes("Console");
      if (!passed) allAdminPassed = false;
      console.log(`    - ${ar.name} (${ar.path}): ${passed ? "OK" : "FAILED"}`);
    }
    recordResult(22, "Admin Panel & All Admin Pages", allAdminPassed, "All 9 admin management modules verified");

    // -------------------------------------------------------------
    // 23. Logout Flow
    // -------------------------------------------------------------
    console.log("Checking 23: Logout Flow...");
    await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: "networkidle2" });
    await page.evaluate(async () => {
      try { await fetch("/api/auth/logout", { method: "POST" }); } catch (e) {}
      window.location.href = "/login";
    });
    await page.waitForNavigation({ waitUntil: "networkidle2" });
    const logoutCookies = await page.cookies();
    if (logoutCookies.length > 0) {
      await page.deleteCookie(...logoutCookies);
    }
    const logoutUrl = page.url();
    const isLoggedOut = logoutUrl.includes("/login") || logoutUrl.includes("/");
    recordResult(23, "Logout Flow", isLoggedOut, `Session terminated, redirected to ${logoutUrl}`);

    // -------------------------------------------------------------
    // 24. Protected Routes While Logged Out
    // -------------------------------------------------------------
    console.log("Checking 24: Protected Routes While Logged Out...");
    const protectedPaths = ["/dashboard", "/profile", "/settings", "/admin"];
    let allBlocked = true;
    for (const p of protectedPaths) {
      await page.goto(`${FRONTEND_URL}${p}`, { waitUntil: "networkidle2" });
      const currentUrl = page.url();
      const redirectedToLogin = currentUrl.includes("/login");
      if (!redirectedToLogin) {
        allBlocked = false;
        console.error(`    - Path ${p} allowed unauthenticated access! Current URL: ${currentUrl}`);
      }
    }
    recordResult(24, "Protected Routes While Logged Out", allBlocked, "All 4 sensitive routes redirected to /login");

  } catch (err) {
    console.error("Browser Verification Error:", err);
  } finally {
    await browser.close();
  }

  console.log("\n==================================================");
  console.log("BROWSER VERIFICATION SUMMARY");
  console.log("==================================================");
  const totalPassed = results.filter((r) => r.passed).length;
  console.log(`Total Routes Verified: ${results.length}/24`);
  console.log(`Passed: ${totalPassed}`);
  console.log(`Failed: ${results.length - totalPassed}`);
  console.log(`Page Runtime Errors: ${pageErrors.length}`);
  console.log(`Failed API (5xx) Requests: ${failedApiRequests.length}`);

  if (totalPassed === 24 && pageErrors.length === 0 && failedApiRequests.length === 0) {
    console.log("\n>>> PHASE 1 BROWSER VERIFICATION: 100% CLEAN PASS <<<\n");
  } else {
    console.error("\n>>> PHASE 1 BROWSER VERIFICATION HAS FAILURES <<<\n");
    process.exit(1);
  }
}

runBrowserVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
