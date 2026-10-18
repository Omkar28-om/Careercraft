import test from "node:test";
import assert from "node:assert/strict";
import {
  isAllowedOrigin,
  isUnsafeMethod,
  rejectUntrustedWriteOrigin,
  resolveAllowedOrigins,
  validateRuntimeConfig,
} from "./security.js";

test("production CORS accepts only configured browser origins", () => {
  const origins = resolveAllowedOrigins({
    clientUrl: "https://app.example.test",
    corsOrigins: "https://admin.example.test, https://preview.example.test ",
    nodeEnv: "production",
  });
  assert.equal(origins.size, 3);
  assert.equal(isAllowedOrigin("https://app.example.test", origins), true);
  assert.equal(isAllowedOrigin("http://localhost:5177", origins), false);
  assert.equal(isAllowedOrigin("https://attacker.example", origins), false);
  assert.equal(isAllowedOrigin(undefined, origins), true);
});

test("development origins include the configured Vite port range", () => {
  const origins = resolveAllowedOrigins({
    clientUrl: "http://localhost:5177",
    nodeEnv: "development",
  });
  assert.equal(origins.has("http://localhost:5177"), true);
  assert.equal(origins.has("http://localhost:5173"), true);
});

test("cross-origin writes are rejected while safe reads and same-origin writes pass", () => {
  const origins = new Set(["https://app.example.test"]);
  const request = (method, origin) => ({ method, get: () => origin });
  assert.equal(isUnsafeMethod("GET"), false);
  assert.equal(isUnsafeMethod("PATCH"), true);
  assert.equal(rejectUntrustedWriteOrigin(request("GET", "https://evil.test"), origins), false);
  assert.equal(rejectUntrustedWriteOrigin(request("POST", "https://evil.test"), origins), true);
  assert.equal(rejectUntrustedWriteOrigin(request("PATCH", "https://app.example.test"), origins), false);
  assert.equal(rejectUntrustedWriteOrigin(request("POST", undefined), origins), false);
});

test("runtime configuration rejects missing database and weak JWT secrets", () => {
  assert.deepEqual(validateRuntimeConfig({}), [
    "DATABASE_URL is required",
    "JWT_SECRET is required",
  ]);
  assert.deepEqual(validateRuntimeConfig({
    DATABASE_URL: "postgres://db",
    JWT_SECRET: "replace_with_a_long_random_secret",
  }), ["JWT_SECRET must be a unique secret of at least 32 characters"]);
  assert.deepEqual(validateRuntimeConfig({
    DATABASE_URL: "postgres://db",
    JWT_SECRET: "x".repeat(64),
  }), []);
  assert.deepEqual(validateRuntimeConfig({
    DATABASE_URL: "postgres://db",
    JWT_SECRET: "x".repeat(64),
    NODE_ENV: "production",
    CLIENT_URL: "http://app.example.test",
  }), [
    "CLIENT_URL must use HTTPS in production",
  ]);
});
