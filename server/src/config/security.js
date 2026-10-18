const DEVELOPMENT_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  "http://localhost:5177",
  "http://localhost:5178",
  "http://localhost:5179",
  "http://localhost:5180",
  "http://localhost:5181",
  "http://localhost:5182",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
  "http://127.0.0.1:5176",
  "http://127.0.0.1:5177",
  "http://127.0.0.1:5178",
  "http://127.0.0.1:5179",
  "http://127.0.0.1:5180",
  "http://127.0.0.1:5181",
  "http://127.0.0.1:5182",
];

export function resolveAllowedOrigins({ clientUrl, corsOrigins, nodeEnv }) {
  const configured = [clientUrl, ...(corsOrigins || "").split(",")]
    .map((origin) => origin.trim())
    .filter(Boolean);

  return new Set([
    ...configured,
    ...(nodeEnv === "production" ? [] : DEVELOPMENT_ORIGINS),
  ]);
}

export function isAllowedOrigin(origin, allowedOrigins) {
  return !origin || allowedOrigins.has(origin);
}

export function isUnsafeMethod(method) {
  return !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
}

// CORS alone does not stop cross-origin HTML form submissions. Check Origin on
// state-changing browser requests as a second guard for cookie-authenticated APIs.
export function rejectUntrustedWriteOrigin(req, allowedOrigins) {
  const origin = req.get("origin");
  return isUnsafeMethod(req.method) && Boolean(origin) && !allowedOrigins.has(origin);
}

export function validateRuntimeConfig(env) {
  const problems = [];
  if (!env.DATABASE_URL?.trim()) problems.push("DATABASE_URL is required");
  if (!env.JWT_SECRET?.trim()) {
    problems.push("JWT_SECRET is required");
  } else if (env.JWT_SECRET.length < 32 || env.JWT_SECRET === "replace_with_a_long_random_secret") {
    problems.push("JWT_SECRET must be a unique secret of at least 32 characters");
  }
  if (env.NODE_ENV === "production") {
    if (!env.CLIENT_URL?.trim()) {
      problems.push("CLIENT_URL is required in production");
    } else if (!env.CLIENT_URL.startsWith("https://")) {
      problems.push("CLIENT_URL must use HTTPS in production");
    }
    const insecureOrigins = (env.CORS_ORIGINS || "")
      .split(",")
      .map((origin) => origin.trim())
      .filter((origin) => origin && !origin.startsWith("https://"));
    if (insecureOrigins.length) problems.push("CORS_ORIGINS entries must use HTTPS in production");
  }
  return problems;
}
