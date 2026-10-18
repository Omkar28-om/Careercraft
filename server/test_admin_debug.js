import puppeteer from "puppeteer-core";
import pool from "./src/db.js";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const FRONTEND_URL = "http://localhost:5177";

async function testAdmin() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
  });
  const page = await browser.newPage();
  page.on("console", (m) => console.log("PAGE CONSOLE:", m.text()));
  page.on("pageerror", (e) => console.log("PAGE ERROR:", e.message));

  // Check admin user in db
  const adminRow = await pool.query("SELECT id, email, role FROM users WHERE email = 'browser_admin_fb7fb195@example.com'");
  console.log("Admin in DB:", adminRow.rows);

  await page.goto(`${FRONTEND_URL}/login`, { waitUntil: "networkidle2" });
  await page.type('input[type="email"]', 'browser_admin_fb7fb195@example.com');
  await page.type('input[type="password"]', 'Password123!');
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2" }),
    page.click('button[type="submit"]'),
  ]);

  console.log("Post admin login URL:", page.url());
  await new Promise((r) => setTimeout(r, 2000));
  console.log("Current URL after 2s:", page.url());

  await page.goto(`${FRONTEND_URL}/admin`, { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 2000));
  console.log("Admin page URL:", page.url());
  const adminText = await page.evaluate(() => document.body.innerText);
  console.log("Admin Text Sample:\n", adminText.slice(0, 400));

  await browser.close();
}

testAdmin().catch(console.error);
