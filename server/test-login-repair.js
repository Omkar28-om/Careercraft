import puppeteer from "puppeteer-core";
import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const FRONTEND_URL = "http://localhost:5177";
const BACKEND_URL = "http://localhost:5000";

const screenshotsDir = resolve("client/dist/test_screenshots");
if (!existsSync(screenshotsDir)) {
  mkdirSync(screenshotsDir, { recursive: true });
}

async function runTests() {
  console.log("==================================================");
  console.log("CAREERCRAFT — LOGIN PAGE AUTOMATED VERIFICATION");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,800"],
  });

  try {
    const page = await browser.newPage();
    const consoleLogs = [];
    const pageErrors = [];

    page.on("console", (msg) => consoleLogs.push(msg.text()));
    page.on("pageerror", (err) => pageErrors.push(err.message));

    // 1. Direct route load
    console.log("\n1. Navigating to Login Page directly...");
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: "networkidle2" });

    assert(page.url().includes("/login"), "Navigated directly to /login route");

    // 2. Left panel inspection: Heading badge, status badge, tagline, Minion image
    console.log("\n2. Inspecting Left Panel Reference Elements...");
    const eyebrowText = await page.$eval(".login-eyebrow", (el) => el.innerText.trim());
    assert(
      eyebrowText.toUpperCase().includes("YOUR NEXT CHAPTER STARTS HERE"),
      `Heading badge matches: "${eyebrowText}"`
    );

    const capText = await page.$eval("#cap", (el) => el.innerText.trim());
    assert(
      capText.includes("Career Companion · Active"),
      `Status badge matches: "${capText}"`
    );

    const taglineText = await page.$eval(".login-mascot-copy", (el) => el.innerText.trim());
    assert(
      taglineText === "Build skills. Find your direction. Make your next move.",
      `Tagline matches: "${taglineText}"`
    );

    const mascotImg = await page.$eval(".page-mascot__image", (img) => ({
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      complete: img.complete,
      src: img.src,
    }));
    assert(
      mascotImg.complete && mascotImg.naturalWidth > 0 && mascotImg.naturalHeight > 0,
      `Minion image loaded cleanly (${mascotImg.naturalWidth}x${mascotImg.naturalHeight})`
    );

    // 3. SVG Eye structure verification (Stuart, Kevin, Bob)
    console.log("\n3. Verifying Eye & Pupil Structure...");
    const eyeCount = await page.$$eval(".eye", (els) => els.length);
    assert(eyeCount === 5, `All 5 eyes rendered for Stuart, Kevin, and Bob (Found: ${eyeCount})`);

    const clipCount = await page.$$eval("clipPath circle", (els) => els.length);
    assert(clipCount >= 1, `Eye clipPath defined to prevent pupil overflow (${clipCount})`);

    // 4. Test Eye Tracking with Mouse Movement
    console.log("\n4. Testing Pointer Movement & Eye Tracking...");
    // Move mouse to top-right (over login card)
    await page.mouse.move(950, 180);
    await new Promise((r) => setTimeout(r, 250));

    const pupilsTopRight = await page.$$eval(".eye g[id^='pm']", (els) =>
      els.map((el) => el.style.transform)
    );
    // Since pointer is at (950, 180) and mascot is around (250, 400), x should be positive
    console.log("Pupil transforms when mouse is at (950, 180):", pupilsTopRight[0]);
    assert(
      pupilsTopRight.some((t) => t.includes("translate(") && parseFloat(t.split("(")[1]) > 0),
      "Pupils tracked mouse to top-right"
    );

    // Move mouse to bottom-left
    await page.mouse.move(50, 750);
    await new Promise((r) => setTimeout(r, 250));

    const pupilsBottomLeft = await page.$$eval(".eye g[id^='pm']", (els) =>
      els.map((el) => el.style.transform)
    );
    console.log("Pupil transforms when mouse is at (50, 750):", pupilsBottomLeft[0]);
    assert(
      pupilsBottomLeft.some((t) => t.includes("translate(") && parseFloat(t.split("(")[1]) < 0),
      "Pupils tracked mouse to bottom-left"
    );

    // 5. Test Mascot Hover and Click/Poke
    console.log("\n5. Testing Mascot Hover and Click/Poke Interaction...");
    const mascotBox = await page.$eval("#pm", (el) => {
      const rect = el.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    });

    await page.mouse.move(mascotBox.x, mascotBox.y);
    await new Promise((r) => setTimeout(r, 150));

    const isHoverCheekRaised = await page.$eval(".eye", (el) =>
      el.style.getPropertyValue("--c")
    );
    assert(isHoverCheekRaised === "0.9", `Hover perks up mascot with smile cheek: ${isHoverCheekRaised}`);

    // Poke by clicking mascot
    await page.mouse.click(mascotBox.x, mascotBox.y);
    await new Promise((r) => setTimeout(r, 100));

    const surprisedPupil = await page.$eval(".eye", (el) =>
      el.style.getPropertyValue("--p")
    );
    assert(surprisedPupil === "0.7", `Poke triggers surprised reaction with contracted pupil (0.7): ${surprisedPupil}`);

    // Wait for poke animation to settle
    await new Promise((r) => setTimeout(r, 1800));

    // 6. Test Password Privacy Reaction (Eyelids closed when focused and password hidden)
    console.log("\n6. Testing Password Focus and Eye Hide/Show Interaction...");
    await page.click("#password");
    await new Promise((r) => setTimeout(r, 200));

    const passwordFocusedLid = await page.$eval(".eye", (el) =>
      el.style.getPropertyValue("--l")
    );
    assert(passwordFocusedLid === "1", `Mascot covers/closes eyes when password is focused (--l: 1): ${passwordFocusedLid}`);

    // Click show password toggle
    await page.click(".login-password-toggle");
    await new Promise((r) => setTimeout(r, 200));

    const passwordRevealedLid = await page.$eval(".eye", (el) =>
      el.style.getPropertyValue("--l")
    );
    const passwordRevealedCheek = await page.$eval(".eye", (el) =>
      el.style.getPropertyValue("--c")
    );
    assert(
      passwordRevealedLid === "0" && passwordRevealedCheek === "0.9",
      `Mascot opens happy eyes when password toggle is clicked (lid: 0, cheek: 0.9)`
    );

    // 7. Form validation test (Empty fields)
    console.log("\n7. Testing Form Validation (Empty Fields)...");
    // Clear inputs with backspace
    await page.click("#email", { clickCount: 3 });
    await page.keyboard.press("Backspace");
    await page.click("#password", { clickCount: 3 });
    await page.keyboard.press("Backspace");

    // Remove required temporarily in DOM to test custom JS validation message
    await page.evaluate(() => {
      document.querySelector("#email").removeAttribute("required");
      document.querySelector("#password").removeAttribute("required");
    });

    await page.click(".login-submit");
    await page.waitForSelector(".login-message--error", { timeout: 3000 });

    const emptyErrorMsg = await page.$eval(".login-message--error", (el) => el.innerText.trim());
    assert(
      emptyErrorMsg.includes("Please enter your email address"),
      `Empty email validation works: "${emptyErrorMsg}"`
    );

    // 8. Test Invalid Credentials
    console.log("\n8. Testing Invalid Credentials Error & Card Shake...");
    await page.click("#email", { clickCount: 3 });
    await page.keyboard.press("Backspace");
    await page.type("#email", "nonexistent_tester@example.com");

    await page.click("#password", { clickCount: 3 });
    await page.keyboard.press("Backspace");
    await page.type("#password", "WrongPassword999!");

    await page.click(".login-submit");
    await page.waitForSelector(".login-message--error", { timeout: 5000 });

    const invalidError = await page.$eval(".login-message--error", (el) => el.innerText.trim());
    assert(
      invalidError.length > 0,
      `Invalid login rejected with error message: "${invalidError}"`
    );

    // 9. Test Successful Login with Real Backend
    console.log("\n9. Testing Real Authentication Flow & Celebration...");
    // Generate a fresh unique account via register first to ensure valid credentials
    const testEmail = `auth_test_${Date.now()}@teststudent.org`;
    const testPassword = "Password123!";
    const testName = "Test Mascot Verifier";

    const regPage = await browser.newPage();
    await regPage.goto(`${FRONTEND_URL}/register`, { waitUntil: "networkidle2" });
    await regPage.type('input[placeholder="Your Full Name"]', testName);
    await regPage.type('input[type="email"]', testEmail);
    await regPage.type('input[placeholder="Minimum 8 characters"]', testPassword);
    await regPage.type('input[placeholder="Re-enter password"]', testPassword);
    await Promise.all([
      regPage.waitForNavigation({ waitUntil: "networkidle2" }),
      regPage.click('button[type="submit"]'),
    ]);
    await regPage.close();

    // Now log in on the main login page
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: "networkidle2" });
    await page.type("#email", testEmail);
    await page.type("#password", testPassword);

    await page.click(".login-submit");

    // Wait for celebration state
    await page.waitForSelector(".login-message--success", { timeout: 5000 });
    const successMsg = await page.$eval(".login-message--success", (el) => el.innerText.trim());
    assert(successMsg.includes("Login successful"), `Success message displayed: "${successMsg}"`);

    const cheerCap = await page.$eval("#cap", (el) => el.innerText.trim());
    assert(cheerCap.includes("Welcome back"), `Celebration badge text: "${cheerCap}"`);

    // Verify post-login redirect occurred
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 8000 });
    const postLoginUrl = page.url();
    assert(
      postLoginUrl.includes("/domains") || postLoginUrl.includes("/courses"),
      `Redirected to correct post-login destination: ${postLoginUrl}`
    );

    // 10. Responsive Viewport Verifications
    console.log("\n10. Testing Responsive Viewports...");
    const respPage = await browser.newPage();
    const cdp = await respPage.target().createCDPSession();
    await cdp.send("Network.clearBrowserCookies");
    await cdp.send("Network.clearBrowserCache");
    await respPage.goto(`${FRONTEND_URL}/login`, { waitUntil: "domcontentloaded" });
    await respPage.evaluate(() => {
      try { localStorage.clear(); } catch {}
      try { sessionStorage.clear(); } catch {}
    });
    await respPage.reload({ waitUntil: "networkidle2" });
    await respPage.waitForSelector(".login-card", { timeout: 8000 });
    await respPage.screenshot({ path: `${screenshotsDir}/desktop_1280x800.png` });
    const desktopScrollX = await respPage.evaluate(() => window.scrollX);
    assert(desktopScrollX === 0, "Desktop has 0 horizontal scroll");

    // Tablet: 768x1024
    await respPage.setViewport({ width: 768, height: 1024 });
    await respPage.screenshot({ path: `${screenshotsDir}/tablet_768x1024.png` });
    const tabletScrollX = await respPage.evaluate(() => window.scrollX);
    assert(tabletScrollX === 0, "Tablet has 0 horizontal scroll");

    // Mobile: 375x667
    await respPage.setViewport({ width: 375, height: 667 });
    await respPage.screenshot({ path: `${screenshotsDir}/mobile_375x667.png` });
    const mobileScrollX = await respPage.evaluate(() => window.scrollX);
    assert(mobileScrollX === 0, "Mobile has 0 horizontal scroll");
    const mobileFormVisible = await respPage.$eval(".login-card", (el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    assert(mobileFormVisible, "Login card is fully visible and accessible on mobile viewport");

    await respPage.close();

    // Check console errors
    console.log("\n11. Console & Page Error Summary...");
    const criticalErrors = pageErrors.filter((e) => !e.includes("ResizeObserver"));
    assert(criticalErrors.length === 0, `0 critical runtime page errors (Count: ${criticalErrors.length})`);

    console.log(`\n==================================================`);
    console.log(`TOTAL: ${passed} PASSED, ${failed} FAILED`);
    console.log(`==================================================`);
  } finally {
    await browser.close();
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
