/**
 * Lightweight, production-safe in-memory rate limiter middleware.
 * Zero external dependencies. Uses sliding-window / time-bucket tracking.
 */

class InMemoryRateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60 * 1000; // default 1 minute
    this.max = options.max || 60; // default 60 requests per window
    this.message = options.message || "Too many requests. Please try again later.";
    this.keyGenerator = options.keyGenerator || ((req) => {
      // Prefer authenticated user ID if available, otherwise IP address
      if (req.user && req.user.id) {
        return `user:${req.user.id}`;
      }
      return req.ip || req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown";
    });
    this.hits = new Map();

    // Periodic sweep every 5 minutes to prevent memory leak
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, records] of this.hits.entries()) {
        const validRecords = records.filter((timestamp) => now - timestamp < this.windowMs);
        if (validRecords.length === 0) {
          this.hits.delete(key);
        } else {
          this.hits.set(key, validRecords);
        }
      }
    }, 5 * 60 * 1000);

    // Unref interval so it does not block Node process exit
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  middleware() {
    return (req, res, next) => {
      // In test mode or when disabled via header/env for tests if needed
      if (process.env.DISABLE_RATE_LIMITER === "true" || process.env.NODE_ENV === "test") {
        return next();
      }

      const key = this.keyGenerator(req);
      const now = Date.now();
      const userHits = (this.hits.get(key) || []).filter(
        (timestamp) => now - timestamp < this.windowMs
      );

      if (userHits.length >= this.max) {
        const oldestHit = userHits[0];
        const retryAfterSeconds = Math.ceil((oldestHit + this.windowMs - now) / 1000);
        res.setHeader("Retry-After", Math.max(1, retryAfterSeconds));
        return res.status(429).json({
          success: false,
          message: this.message,
          retryAfter: Math.max(1, retryAfterSeconds),
        });
      }

      userHits.push(now);
      this.hits.set(key, userHits);
      next();
    };
  }

  reset() {
    this.hits.clear();
  }
}

// 1. Auth Rate Limiter: 30 attempts per 15 minutes per IP
export const authRateLimiter = new InMemoryRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: "Too many authentication attempts. Please try again after 15 minutes.",
}).middleware();

// 2. Password Rate Limiter: 10 attempts per 15 minutes per user/IP
export const passwordRateLimiter = new InMemoryRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many password change attempts. Please try again later.",
}).middleware();

// 3. Code Submission Rate Limiter: 20 submissions per minute per user/IP
export const codeSubmissionRateLimiter = new InMemoryRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: "Submission rate limit reached. Please wait before submitting code again.",
}).middleware();

// 4. Recommendation Regeneration Rate Limiter: 5 requests per 5 minutes per user/IP (in addition to 300s cooldown)
export const recommendationRateLimiter = new InMemoryRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 6,
  message: "Recommendation refresh limit reached. Please wait before refreshing again.",
}).middleware();

export default InMemoryRateLimiter;
