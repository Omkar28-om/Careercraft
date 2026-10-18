import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, ".env") });

const BASE = "http://localhost:5000/api";

async function req(method, endpoint, body = null, cookie = "") {
  const opts = {
    method,
    headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };
  const res = await fetch(`${BASE}${endpoint}`, opts);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data, setCookie: res.headers.get("set-cookie") };
}

function extractCookie(setCookieHeader) {
  if (!setCookieHeader) return "";
  const match = setCookieHeader.match(/token=[^;]+/);
  return match ? match[0] : "";
}

let passed = 0, failed = 0;

function check(label, condition, detail = "") {
  if (condition) {
    console.log(`  PASS: ${label}`);
    passed++;
  } else {
    console.log(`  FAIL: ${label}${detail ? " — " + detail : ""}`);
    failed++;
  }
}

async function run() {
  console.log("\n=== STEP 14.5 Settings API Tests ===\n");

  // Register test user
  const testEmail = `settings_test_${Date.now()}@careercraft.test`;
  const regRes = await req("POST", "/auth/register", { name: "Settings Test", email: testEmail, password: "TestPass123!" });
  const cookie = extractCookie(regRes.setCookie);
  check("User registered", regRes.status === 201, `got ${regRes.status}`);

  // TEST 1: GET /api/settings (authenticated)
  const getRes = await req("GET", "/settings", null, cookie);
  check("T1: GET /settings — 200", getRes.status === 200);
  check("T1: Has user object", getRes.data?.user !== undefined);
  check("T1: Has preferences object", getRes.data?.preferences !== undefined);
  check("T1: password_hash NOT in user", !("password_hash" in (getRes.data?.user || {})));
  check("T1: Default theme is dark", getRes.data?.preferences?.theme === "dark");
  check("T1: job_notifications default true", getRes.data?.preferences?.job_notifications === true);

  // TEST 2: PATCH /api/settings — update theme
  const themeRes = await req("PATCH", "/settings", { theme: "light" }, cookie);
  check("T2: PATCH theme to light — 200", themeRes.status === 200);
  check("T2: Theme updated to light", themeRes.data?.preferences?.theme === "light");

  // TEST 3: PATCH /api/settings — invalid theme
  const badThemeRes = await req("PATCH", "/settings", { theme: "neon" }, cookie);
  check("T3: Invalid theme rejected — 400", badThemeRes.status === 400);

  // TEST 4: PATCH /api/settings — update notification prefs
  const notifRes = await req("PATCH", "/settings", { job_notifications: false, course_notifications: false }, cookie);
  check("T4: Notification prefs updated — 200", notifRes.status === 200);
  check("T4: job_notifications is now false", notifRes.data?.preferences?.job_notifications === false);

  // TEST 5: Verify settings persisted
  const get2Res = await req("GET", "/settings", null, cookie);
  check("T5: Persisted theme = light", get2Res.data?.preferences?.theme === "light");
  check("T5: Persisted job_notifications = false", get2Res.data?.preferences?.job_notifications === false);

  // TEST 6: PATCH /api/settings/password — missing fields
  const pwMissingRes = await req("PATCH", "/settings/password", { currentPassword: "TestPass123!" }, cookie);
  check("T6: Missing newPassword — 400", pwMissingRes.status === 400);

  // TEST 7: PATCH /api/settings/password — wrong current password
  const pwWrongRes = await req("PATCH", "/settings/password", {
    currentPassword: "WrongPassword!",
    newPassword: "NewPass123!",
  }, cookie);
  check("T7: Wrong current password — 401", pwWrongRes.status === 401);

  // TEST 8: PATCH /api/settings/password — short new password
  const pwShortRes = await req("PATCH", "/settings/password", {
    currentPassword: "TestPass123!",
    newPassword: "short",
  }, cookie);
  check("T8: Short new password — 400", pwShortRes.status === 400);

  // TEST 9: PATCH /api/settings/password — same password
  const pwSameRes = await req("PATCH", "/settings/password", {
    currentPassword: "TestPass123!",
    newPassword: "TestPass123!",
  }, cookie);
  check("T9: Same password — 400", pwSameRes.status === 400);

  // TEST 10: Successful password change
  const pwRes = await req("PATCH", "/settings/password", {
    currentPassword: "TestPass123!",
    newPassword: "NewSecurePass456!",
  }, cookie);
  check("T10: Password changed — 200", pwRes.status === 200);
  check("T10: No password_hash returned", !("password_hash" in (pwRes.data || {})));

  // TEST 11: Login with new password works
  const loginRes = await req("POST", "/auth/login", { email: testEmail, password: "NewSecurePass456!" });
  check("T11: Login with new password — 200", loginRes.status === 200);

  // TEST 12: Login with old password fails
  const oldLoginRes = await req("POST", "/auth/login", { email: testEmail, password: "TestPass123!" });
  check("T12: Old password rejected — 401", oldLoginRes.status === 401);

  // TEST 13: Unauthenticated access to settings
  const unAuthRes = await req("GET", "/settings");
  check("T13: Unauthenticated settings — 401", unAuthRes.status === 401);

  // TEST 14: Cannot update another user's settings via body
  const reg2Res = await req("POST", "/auth/register", {
    name: "User Two",
    email: `user2_${Date.now()}@careercraft.test`,
    password: "TestPass123!",
  });
  const cookie2 = extractCookie(reg2Res.setCookie);

  // Try to send userId in body — server ignores it and uses req.user.id
  const crossRes = await req("PATCH", "/settings", { theme: "system", user_id: reg2Res.data?.user?.id }, cookie);
  check("T14: Cannot spoof user_id in body — own settings updated", crossRes.status === 200);

  // Verify user1's settings updated (theme=system), not an error
  const verify1 = await req("GET", "/settings", null, cookie);
  check("T14b: User1 theme updated to system", verify1.data?.preferences?.theme === "system");

  // User2 still has default theme
  const verify2 = await req("GET", "/settings", null, cookie2);
  check("T14c: User2 theme unchanged (dark)", verify2.data?.preferences?.theme === "dark");

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error("Test crashed:", err.message);
  process.exit(1);
});