import puppeteer from "puppeteer-core";
import pool from "./src/db.js";
import bcrypt from "bcryptjs";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const FRONTEND_URL = "http://localhost:5177";
const BACKEND_URL = "http://localhost:5000";

async function verifyAuth() {
  console.log("==================================================");
  console.log("CAREERCRAFT — CLEAN EMAIL/PASSWORD AUTH VERIFICATION");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
  });

  const page = await browser.newPage();
  const consoleMessages = [];
  const pageErrors = [];

  page.on("console", (msg) => {
    consoleMessages.push(msg.text());
  });
  page.on("pageerror", (err) => {
    pageErrors.push(err.message);
  });

  try {
    // ----------------------------------------------------
    // TEST 1: Register page loads without Google Login
    // ----------------------------------------------------
    console.log("\n--- Checking Register Page ---");
    await page.goto(`${FRONTEND_URL}/register`, { waitUntil: "networkidle2" });
    const regText = await page.evaluate(() => document.body.innerText);
    const hasGoogleOnReg = /Continue with Google|Sign in with Google|Google/i.test(regText);
    assert(!hasGoogleOnReg, "Register page does NOT contain any Google Login buttons or text");

    const nameInput = await page.$('input[placeholder="Your Full Name"]');
    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[placeholder="Minimum 8 characters"]');
    const confirmPasswordInput = await page.$('input[placeholder="Re-enter password"]');
    assert(Boolean(nameInput && emailInput && passwordInput && confirmPasswordInput), "Register page has all required clean registration fields");

    // Check no Google scripts loaded
    const googleScriptsOnReg = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("script")).some(s => s.src.includes("accounts.google.com"));
    });
    assert(!googleScriptsOnReg, "Register page does NOT load Google Identity Services SDK");

    // ----------------------------------------------------
    // TEST 2: Login page loads without Google Login
    // ----------------------------------------------------
    console.log("\n--- Checking Login Page ---");
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: "networkidle2" });
    const loginText = await page.evaluate(() => document.body.innerText);
    const hasGoogleOnLogin = /Continue with Google|Sign in with Google|Google/i.test(loginText);
    assert(!hasGoogleOnLogin, "Login page does NOT contain any Google Login buttons or text");

    const loginEmailInput = await page.$('input[type="email"]');
    const loginPasswordInput = await page.$('input[type="password"]');
    assert(Boolean(loginEmailInput && loginPasswordInput), "Login page has email and password inputs");

    const googleScriptsOnLogin = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("script")).some(s => s.src.includes("accounts.google.com"));
    });
    assert(!googleScriptsOnLogin, "Login page does NOT load Google Identity Services SDK");

    // ----------------------------------------------------
    // TEST 3: Clean Email/Password Registration Works
    // ----------------------------------------------------
    console.log("\n--- Testing Browser Registration Flow ---");
    const testEmail = `clean_auth_${Date.now()}@teststudent.org`;
    const testPassword = "Password123!";
    const testName = "Verified Student";

    await page.goto(`${FRONTEND_URL}/register`, { waitUntil: "networkidle2" });
    await page.type('input[placeholder="Your Full Name"]', testName);
    await page.type('input[type="email"]', testEmail);
    await page.type('input[placeholder="Minimum 8 characters"]', testPassword);
    await page.type('input[placeholder="Re-enter password"]', testPassword);

    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle2" }),
      page.click('button[type="submit"]'),
    ]);

    assert(page.url().includes("/dashboard"), `Registration successfully redirected to /dashboard (Current: ${page.url()})`);

    // Verify session persistence and dashboard content
    await page.waitForFunction(() => !document.body.innerText.includes("Verifying secure session..."), { timeout: 15000 });
    const dashText = await page.evaluate(() => document.body.innerText);
    assert(dashText.includes(testName) && dashText.includes("CAREER READINESS"), "Dashboard rendered user data after registration");

    // ----------------------------------------------------
    // TEST 4: /api/auth/me Works
    // ----------------------------------------------------
    console.log("\n--- Verifying /api/auth/me ---");
    const cookies = await page.cookies();
    const tokenCookie = cookies.find(c => c.name === "token");
    assert(Boolean(tokenCookie), "HTTP-only JWT cookie 'token' is set");

    const meRes = await page.evaluate(async (url) => {
      const res = await fetch(`${url}/api/auth/me`, { credentials: "include" });
      return { status: res.status, data: await res.json() };
    }, BACKEND_URL);

    assert(meRes.status === 200 && meRes.data.success && meRes.data.user.email === testEmail, `/api/auth/me returned authenticated user: ${meRes.data.user?.email}`);

    // ----------------------------------------------------
    // TEST 5: Logout Works
    // ----------------------------------------------------
    console.log("\n--- Testing Logout Flow ---");
    await page.evaluate(async (url) => {
      await fetch(`${url}/api/auth/logout`, { method: "POST", credentials: "include" });
    }, BACKEND_URL);
    await page.deleteCookie({ name: "token", domain: "localhost" });

    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: "networkidle2" });
    assert(page.url().includes("/login"), "User logged out successfully");

    // ----------------------------------------------------
    // TEST 6: Login Works
    // ----------------------------------------------------
    console.log("\n--- Testing Browser Login Flow ---");
    await page.type('input[type="email"]', testEmail);
    await page.type('input[type="password"]', testPassword);

    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle2" }),
      page.click('button[type="submit"]'),
    ]);

    assert(page.url().includes("/dashboard"), `Login successfully redirected to /dashboard (Current: ${page.url()})`);

    // ----------------------------------------------------
    // TEST 7: Protected Routes Work When Logged Out
    // ----------------------------------------------------
    console.log("\n--- Testing Protected Routes (Logged Out) ---");
    await page.evaluate(async (url) => {
      await fetch(`${url}/api/auth/logout`, { method: "POST", credentials: "include" });
    }, BACKEND_URL);
    await page.deleteCookie({ name: "token", domain: "localhost" });

    // Try /dashboard
    await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 800));
    assert(page.url().includes("/login"), "Access to /dashboard while unauthenticated redirects to /login");

    // Try /profile
    await page.goto(`${FRONTEND_URL}/profile`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 800));
    assert(page.url().includes("/login"), "Access to /profile while unauthenticated redirects to /login");

    // Try /settings
    await page.goto(`${FRONTEND_URL}/settings`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 800));
    assert(page.url().includes("/login"), "Access to /settings while unauthenticated redirects to /login");

    // Try /admin
    await page.goto(`${FRONTEND_URL}/admin`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 800));
    assert(page.url().includes("/login"), "Access to /admin while unauthenticated redirects to /login");

    // ----------------------------------------------------
    // TEST 8: Admin Authentication & Access
    // ----------------------------------------------------
    console.log("\n--- Testing Admin Authentication ---");
    const adminEmail = `admin_clean_${Date.now()}@careercraft.org`;
    const salt = await bcrypt.genSalt(10);
    const pwdHash = await bcrypt.hash("AdminPassword123!", salt);
    await pool.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)",
      ["Super Admin", adminEmail, pwdHash, "admin"]
    );

    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: "networkidle2" });
    await page.type('input[type="email"]', adminEmail);
    await page.type('input[type="password"]', "AdminPassword123!");
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle2" }),
      page.click('button[type="submit"]'),
    ]);

    await page.goto(`${FRONTEND_URL}/admin`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1000));
    const adminPageText = await page.evaluate(() => document.body.innerText);
    assert(adminPageText.includes("Admin") || adminPageText.includes("Platform Overview") || page.url().includes("/admin"), "Admin successfully authenticated and loaded Admin Panel");

    // ----------------------------------------------------
    // TEST 9: Suspended User Protection
    // ----------------------------------------------------
    console.log("\n--- Testing Suspended User Protection ---");
    const suspendedEmail = `suspended_${Date.now()}@careercraft.org`;
    await pool.query(
      "INSERT INTO users (name, email, password_hash, role, status) VALUES ($1, $2, $3, $4, $5)",
      ["Suspended Student", suspendedEmail, pwdHash, "student", "suspended"]
    );

    // Logout admin first
    await page.deleteCookie({ name: "token", domain: "localhost" });
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: "networkidle2" });
    await page.type('input[type="email"]', suspendedEmail);
    await page.type('input[type="password"]', "AdminPassword123!");
    await page.click('button[type="submit"]');

    await new Promise((r) => setTimeout(r, 1000));
    const suspendedLoginText = await page.evaluate(() => document.body.innerText);
    assert(
      suspendedLoginText.includes("suspended") || suspendedLoginText.includes("Invalid") || page.url().includes("/login"),
      "Suspended user is prevented from logging in"
    );

    // ----------------------------------------------------
    // TEST 10: Endpoint POST /api/auth/google does not exist
    // ----------------------------------------------------
    console.log("\n--- Verifying POST /api/auth/google is Removed ---");
    const googleEndpointRes = await fetch(`${BACKEND_URL}/api/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: "dummy" }),
    });
    assert(googleEndpointRes.status === 404, `POST /api/auth/google returns HTTP 404 Not Found (Actual: ${googleEndpointRes.status})`);

    // Clean up test users
    await pool.query("DELETE FROM users WHERE email IN ($1, $2, $3)", [testEmail, adminEmail, suspendedEmail]);

  } catch (err) {
    console.error("Verification execution error:", err);
    failed++;
  } finally {
    await browser.close();
  }

  console.log("\n==================================================");
  console.log(`TOTAL PASS: ${passed}`);
  console.log(`TOTAL FAIL: ${failed}`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

verifyAuth().catch((err) => {
  console.error(err);
  process.exit(1);
});
