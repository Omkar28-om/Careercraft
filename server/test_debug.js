import puppeteer from "puppeteer-core";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const FRONTEND_URL = "http://localhost:5177";

async function debug() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
  });
  const page = await browser.newPage();
  page.on("console", (m) => console.log("PAGE CONSOLE:", m.text()));
  page.on("pageerror", (e) => console.log("PAGE ERROR:", e.message));

  await page.goto(`${FRONTEND_URL}/login`, { waitUntil: "networkidle2" });
  await page.type('input[type="email"]', 'browser_student_fb7fb195@example.com');
  await page.type('input[type="password"]', 'Password123!');
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2" }),
    page.click('button[type="submit"]'),
  ]);

  // Wait 1.5s for dashboard API calls to populate
  await new Promise((r) => setTimeout(r, 1500));
  const dText = await page.evaluate(() => document.body.innerText);
  console.log("DASHBOARD TEXT SAMPLE:\n", dText.slice(0, 500));

  await page.goto(`${FRONTEND_URL}/settings`, { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 1500));
  const sText = await page.evaluate(() => document.body.innerText);
  console.log("SETTINGS TEXT SAMPLE:\n", sText.slice(0, 500));

  await browser.close();
}

debug().catch(console.error);
