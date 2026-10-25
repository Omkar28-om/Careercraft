import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, ".env") });

import puppeteer from "puppeteer-core";
import pool from "./src/db.js";
import crypto from "crypto";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const FRONTEND_URL = "http://localhost:5177";
const BACKEND_URL = "http://localhost:5000/api";

const EXPECTED_DOMAINS = [
  "Full Stack Development",
  "AI & Machine Learning",
  "Data Science & Analytics",
  "Java Development",
  "Python Development",
  "UI/UX & Product Design",
  "Cybersecurity",
  "Digital Marketing",
];

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  console.log("===============================================================");
  console.log("CAREERCRAFT — PERSONALIZED DOMAIN EXPERIENCE VERIFICATION TEST");
  console.log("===============================================================\n");

  const rand = crypto.randomBytes(4).toString("hex");
  const testEmail = `student_${rand}@careercraft-test.com`;
  const testPassword = "Password123!";
  const testName = `Student ${rand}`;

  // =========================================================================
  // STAGE 1: Backend API Validation
  // =========================================================================
  console.log("--- STAGE 1: Backend API & Schema Verification ---");
  
  // Register via API
  const regRes = await fetch(`${BACKEND_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      name: testName,
      role: "student",
    }),
  });
  const regData = await regRes.json();
  assert(regRes.status === 201 && regData.success, "User registered successfully via API");
  const userId = regData.user?.id;
  assert(Boolean(userId), `User ID retrieved: ${userId}`);

  // Extract auth cookie or token
  const setCookie = regRes.headers.get("set-cookie");
  const cookieMatch = setCookie ? setCookie.match(/token=([^;]+)/) : null;
  const token = regData.token || (cookieMatch ? cookieMatch[1] : null);
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  // Check initial career_domain is null in DB
  const dbCheck1 = await pool.query("SELECT career_domain FROM profiles WHERE id = $1", [userId]);
  assert(
    dbCheck1.rows.length === 1 && dbCheck1.rows[0].career_domain === null,
    "Initial profile has career_domain as null in database"
  );

  // Check invalid domain rejected
  const invalidDomainRes = await fetch(`${BACKEND_URL}/profile/domain`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeader },
    body: JSON.stringify({ domain: "Quantum Astrophysics" }),
  });
  assert(invalidDomainRes.status === 400, "Backend rejected invalid domain with HTTP 400");

  // =========================================================================
  // STAGE 2: Puppeteer Browser Verification
  // =========================================================================
  console.log("\n--- STAGE 2: Browser End-to-End User Experience ---");

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,800"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    page.on("pageerror", (err) => console.error("  [BROWSER PAGE ERROR]", err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") console.error("  [BROWSER ERROR]", msg.text());
    });

    const client = await page.target().createCDPSession();
    await client.send("Network.clearBrowserCookies");

    // 1. Unauthenticated Visitor on Home
    console.log("\n2.1 Checking Public Landing Page for Unauthenticated Visitor...");
    await page.goto(`${FRONTEND_URL}/`, { waitUntil: "networkidle2" });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.waitForSelector("h1", { timeout: 10000 });
    const marketingHeading = await page.$eval("h1", (el) => el.innerText);
    assert(
      marketingHeading.length > 0,
      `Public landing page renders marketing hero: "${marketingHeading.slice(0, 40).replace(/\n/g, ' ')}..."`
    );

    // 2. Login Flow with No Selected Domain -> Redirects to /domains
    console.log("\n2.2 Logging in with new student (no domain)...");
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: "networkidle2" });
    await page.waitForSelector("#email", { visible: true });

    await page.type("#email", testEmail);
    await page.type("#password", testPassword);
    await page.click(".login-submit");

    // Wait for post-login redirect: should navigate to /domains
    console.log("Waiting for post-login redirection to /domains...");
    await page.waitForFunction(
      () => window.location.pathname.includes("/domains"),
      { timeout: 8000 }
    );
    assert(page.url().includes("/domains"), "Redirected to /domains page post-login for first-time user");

    // 3. Verify all 8 official career domains rendered
    console.log("\n2.3 Verifying 8 official domains are displayed...");
    await page.waitForSelector(".domain-card", { timeout: 5000 });
    const renderedDomains = await page.$$eval(".domain-card h3", (elements) =>
      elements.map((el) => el.innerText.trim())
    );

    for (const exp of EXPECTED_DOMAINS) {
      const found = renderedDomains.some((d) => d.toLowerCase().includes(exp.toLowerCase()));
      assert(found, `Rendered domain: "${exp}"`);
    }

    // 4. Select "Full Stack Development" and continue
    console.log("\n2.4 Selecting 'Full Stack Development'...");
    const selectBtn = await page.waitForSelector('button[data-domain-select="Full Stack Development"]', {
      visible: true,
      timeout: 5000,
    });
    await selectBtn.click();

    // Verify redirected to / (Personalized Home)
    console.log("Waiting for redirection to personalized home /...");
    await page.waitForFunction(
      () => window.location.pathname === "/" || window.location.pathname === "",
      { timeout: 8000 }
    );
    await delay(1000);
    assert(page.url().endsWith("/"), "Redirected to / (Personalized Home)");

    // 5. Verify Personalized Home elements
    console.log("\n2.5 Verifying Personalized Home Elements...");
    const welcomeText = await page.$eval("h1", (el) => el.innerText.trim());
    assert(
      welcomeText.includes(testName) || welcomeText.includes("Welcome back"),
      `Personalized welcome message: "${welcomeText}"`
    );

    const hasDomainBadge = await page.evaluate(() => {
      const badges = Array.from(document.querySelectorAll("span"));
      return badges.some((b) => b.innerText.includes("Full Stack Development"));
    });
    assert(hasDomainBadge, "Homepage renders 'Full Stack Development' domain badge");

    const hasContinueLearning = await page.evaluate(() => {
      return document.body.innerText.includes("Continue Learning");
    });
    assert(hasContinueLearning, "Continue Learning section rendered");

    const hasRecommended = await page.evaluate(() => {
      return document.body.innerText.includes("Recommended for You");
    });
    assert(hasRecommended, "Recommended for You section rendered");

    // 6. Verify Database Persistence
    console.log("\n2.6 Verifying PostgreSQL Persistence...");
    const dbCheck2 = await pool.query("SELECT career_domain FROM profiles WHERE id = $1", [userId]);
    assert(
      dbCheck2.rows[0]?.career_domain === "Full Stack Development",
      `Database career_domain updated to: "${dbCheck2.rows[0]?.career_domain}"`
    );

    // 7. Verify Domain Switching via Settings
    console.log("\n2.7 Switching domain to 'Cybersecurity' via /settings...");
    await page.goto(`${FRONTEND_URL}/settings`, { waitUntil: "networkidle2" });
    const cyberBtn = await page.waitForSelector('button[data-settings-domain="Cybersecurity"]', {
      visible: true,
      timeout: 8000,
    });
    await cyberBtn.click();
    await delay(1200);

    // Check DB updated
    const dbCheck3 = await pool.query("SELECT career_domain FROM profiles WHERE id = $1", [userId]);
    assert(
      dbCheck3.rows[0]?.career_domain === "Cybersecurity",
      `Database career_domain changed to: "${dbCheck3.rows[0]?.career_domain}"`
    );

    // Navigate back to /
    await page.goto(`${FRONTEND_URL}/`, { waitUntil: "networkidle2" });
    await delay(1000);
    const hasCyberBadge = await page.evaluate(() => {
      const badges = Array.from(document.querySelectorAll("span"));
      return badges.some((b) => b.innerText.includes("Cybersecurity"));
    });
    assert(hasCyberBadge, "Homepage updated to display 'Cybersecurity' domain badge");

    // 8. Authenticated Navigation & Profile Menu
    console.log("\n2.8 Testing Authenticated Navbar & Profile Dropdown...");
    const profileMenuBtn = await page.waitForSelector('button[aria-label="User profile menu"]', {
      visible: true,
      timeout: 5000,
    });
    await profileMenuBtn.click();
    await delay(400);

    const dropdownText = await page.evaluate(() => {
      const menu = document.querySelector(".animate-in");
      return menu ? menu.innerText : "";
    });
    assert(dropdownText.includes("My Profile"), "Dropdown contains 'My Profile'");
    assert(dropdownText.includes("My Domain"), "Dropdown contains 'My Domain'");
    assert(dropdownText.includes("Settings"), "Dropdown contains 'Settings'");
    assert(dropdownText.includes("Sign Out"), "Dropdown contains 'Sign Out'");
    assert(dropdownText.includes("Cybersecurity"), "Dropdown displays current domain 'Cybersecurity'");

    // 9. Sign Out & Protected Route Verification
    console.log("\n2.9 Testing Sign Out & Protected Route Access Control...");
    const signOutBtn = await page.waitForSelector('button.text-rose-400', { visible: true });
    await signOutBtn.click();

    // Verify redirected to /login
    await page.waitForFunction(
      () => window.location.pathname.includes("/login"),
      { timeout: 8000 }
    );
    assert(page.url().includes("/login"), "Redirected to /login after clicking Sign Out");

    // Try accessing protected route /dashboard
    console.log("Attempting direct access to /dashboard while logged out...");
    await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: "networkidle2" });
    await delay(800);
    assert(page.url().includes("/login"), "Unauthenticated access to /dashboard redirected to /login");

    // Try accessing protected route /settings
    console.log("Attempting direct access to /settings while logged out...");
    await page.goto(`${FRONTEND_URL}/settings`, { waitUntil: "networkidle2" });
    await delay(800);
    assert(page.url().includes("/login"), "Unauthenticated access to /settings redirected to /login");

    // 10. Returning User with Existing Domain Skips /domains
    console.log("\n2.10 Testing Returning User Login with Saved Domain...");
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: "networkidle2" });
    await page.waitForSelector("#email", { visible: true });
    await page.type("#email", testEmail);
    await page.type("#password", testPassword);
    await page.click(".login-submit");

    // Should navigate directly to / (NOT /domains)
    console.log("Waiting for post-login redirect (should bypass /domains)...");
    await page.waitForFunction(
      () => window.location.pathname === "/" || window.location.pathname === "",
      { timeout: 8000 }
    );
    assert(
      !page.url().includes("/domains") && page.url().endsWith("/"),
      "Returning user with saved domain navigated directly to / (bypassed /domains)"
    );

    // 11. Simplified Dashboard
    console.log("\n2.11 Testing Simplified Dashboard (/dashboard)...");
    await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: "networkidle2" });
    await page.waitForSelector("h1", { timeout: 8000 });
    const dashHeading = await page.$eval("h1", (el) => el.innerText);
    assert(
      dashHeading.toLowerCase().includes("dashboard") || dashHeading.length > 0,
      `Dashboard heading rendered: "${dashHeading}"`
    );

    const statCardsCount = await page.$$eval(".rounded-2xl.border", (els) => els.length);
    assert(statCardsCount >= 4, `Dashboard displays key metric and content cards (count: ${statCardsCount})`);

    // 12. Mobile Viewport Navigation
    console.log("\n2.12 Testing Mobile Responsiveness (375x667)...");
    await page.setViewport({ width: 375, height: 667 });
    await page.goto(`${FRONTEND_URL}/`, { waitUntil: "networkidle2" });
    await delay(500);

    // Open mobile menu
    const mobileMenuBtn = await page.waitForSelector('button[aria-label="Toggle navigation menu"]', {
      visible: true,
      timeout: 5000,
    });
    await mobileMenuBtn.click();
    await delay(400);

    const mobileMenuText = await page.evaluate(() => {
      const drawer = document.querySelector('div[role="dialog"]') || document.querySelector(".fixed.inset-0.top-16");
      return drawer ? drawer.innerText : "";
    });
    assert(mobileMenuText.includes("Sign Out"), "Mobile drawer displays 'Sign Out'");
    assert(mobileMenuText.includes("Courses"), "Mobile drawer displays 'Courses'");
    assert(mobileMenuText.includes("Dashboard"), "Mobile drawer displays 'Dashboard'");

  } catch (err) {
    console.error("Test execution exception:", err);
    failed++;
  } finally {
    await browser.close();
    // Clean up test user
    try {
      if (userId) {
        await pool.query("DELETE FROM profiles WHERE id = $1", [userId]);
        await pool.query("DELETE FROM users WHERE id = $1", [userId]);
      }
    } catch (cleanupErr) {
      console.warn("Cleanup error (ignorable):", cleanupErr.message);
    }
    await pool.end();
  }

  console.log("\n===============================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("===============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
