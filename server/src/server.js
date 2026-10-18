import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import pool from "./db.js";
import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import skillsRoutes from "./routes/skills.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import activityRoutes from "./routes/activity.routes.js";
import achievementRoutes from "./routes/achievement.routes.js";
import codingRoutes from "./routes/coding.routes.js";
import projectRoutes from "./routes/project.routes.js";
import courseRoutes from "./routes/course.routes.js";
import jobRoutes from "./routes/job.routes.js";
import freelanceRoutes from "./routes/freelance.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import careerRoutes from "./routes/career.routes.js";
import { isAllowedOrigin, rejectUntrustedWriteOrigin, resolveAllowedOrigins, validateRuntimeConfig } from "./config/security.js";


dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || (process.env.NODE_ENV === "production" ? "" : "http://localhost:5177");
const allowedOrigins = resolveAllowedOrigins({
    clientUrl: CLIENT_URL,
    corsOrigins: process.env.CORS_ORIGINS,
    nodeEnv: process.env.NODE_ENV,
});

// ======================================================
// SECURITY
// ======================================================

app.use(
    helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
        contentSecurityPolicy: false,
    })
);

// ======================================================
// CORS
// ======================================================

app.use(
    cors({
        origin: (origin, callback) => {
            if (isAllowedOrigin(origin, allowedOrigins)) {
                callback(null, true);
            } else {
                const error = new Error("Origin not allowed");
                error.status = 403;
                callback(error);
            }
        },
        credentials: true,
    })
);

// ======================================================
// BODY & COOKIE PARSERS
// ======================================================

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

// ======================================================
// Reject browser cross-origin writes, including form submissions that bypass CORS.
app.use((req, res, next) => {
    if (rejectUntrustedWriteOrigin(req, allowedOrigins)) {
        return res.status(403).json({ success: false, message: "Request origin not allowed" });
    }
    next();
});

// REQUEST LOGGER - DEVELOPMENT (omit query strings to avoid logging sensitive values)
// ======================================================

if (process.env.NODE_ENV !== "production") {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.path}`);
        next();
    });
}

// ======================================================
// ROOT & API ROUTES
// ======================================================

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "CareerCraft API is running ðŸš€",
        version: "1.0.0",
    });
});

app.get("/api", (req, res) => {
    res.status(200).json({
        success: true,
        message: "CareerCraft API is running ðŸš€",
        version: "1.0.0",
    });
});

// ======================================================
// AUTH ROUTES
// ======================================================

app.use("/api/auth", authRoutes);

// ======================================================
// PROFILE ROUTES
// ======================================================

app.use("/api/profile", profileRoutes);

// ======================================================
// SKILLS ROUTES
// ======================================================

app.use("/api/skills", skillsRoutes);

// ======================================================
// DASHBOARD ROUTES
// ======================================================

app.use("/api/dashboard", dashboardRoutes);

// ======================================================
// ACTIVITY ROUTES
// ======================================================

app.use("/api/activity", activityRoutes);

// ======================================================
// ACHIEVEMENT ROUTES
// ======================================================

app.use("/api/achievements", achievementRoutes);

// ======================================================
// CODING PLATFORM ROUTES
// ======================================================

app.use("/api/coding", codingRoutes);

// ======================================================
// STUDENT PROJECTS & PORTFOLIO ROUTES
// ======================================================

app.use("/api/projects", projectRoutes);

// ======================================================
// COURSES & LEARNING PLATFORM ROUTES
// ======================================================

app.use("/api/courses", courseRoutes);

// ======================================================
// JOBS & INTERNSHIPS PLATFORM ROUTES
// ======================================================

app.use("/api/jobs", jobRoutes);

// ======================================================
// FREELANCING MARKETPLACE ROUTES
// ======================================================

app.use("/api/freelance", freelanceRoutes);

// ======================================================
// NOTIFICATIONS ROUTES
// ======================================================

app.use("/api/notifications", notificationRoutes);

// ======================================================
// ADMIN PANEL ROUTES
// ======================================================

app.use("/api/admin", adminRoutes);

// ======================================================
// SETTINGS ROUTES
// ======================================================

app.use("/api/settings", settingsRoutes);
app.use("/api/career", careerRoutes);

// ======================================================
// HEALTH CHECK
// ======================================================

app.get("/api/health", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW() AS database_time");

        res.status(200).json({
            success: true,
            status: "healthy",
            service: "CareerCraft Backend",
            database: "connected",
            databaseTime: result.rows[0].database_time,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Database health check failed:", error.message);

        res.status(503).json({
            success: false,
            status: "unhealthy",
            service: "CareerCraft Backend",
            database: "disconnected",
        });
    }
});

// ======================================================
// API INFO
// ======================================================

app.get("/api/db-test", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT COUNT(*)::int AS user_count FROM users"
        );

        res.status(200).json({
            success: true,
            message: "Database query successful",
            userCount: result.rows[0].user_count,
        });
    } catch (error) {
        console.error("Database query failed:", error.message);

        res.status(500).json({
            success: false,
            message: "Database query failed",
        });
    }
});

// ======================================================
// 404 HANDLER
// ======================================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
        path: req.originalUrl,
    });
});

// ======================================================
// GLOBAL ERROR HANDLER
// ======================================================

app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).json({ success: false, message: "Malformed JSON payload in request body" });
    }
    console.error("Server Error:", err.message || err);

    if (res.headersSent) return next(err);
    res.status(err.status || 500).json({
        success: false,
        message: (process.env.NODE_ENV === "production" && (!err.status || err.status === 500)) ? "Internal server error" : (err.message || "Internal server error"),
    });
});

// ======================================================
// START SERVER
// ======================================================

const configProblems = validateRuntimeConfig(process.env);
if (configProblems.length > 0) {
    console.error(`CareerCraft cannot start: ${configProblems.join("; ")}`);
    process.exit(1);
}

const server = app.listen(PORT, () => {
    console.log("");
    console.log("========================================");
    console.log("       CareerCraft Backend API");
    console.log("========================================");
    console.log(`Server: http://localhost:${PORT}`);
    console.log(`Client: ${CLIENT_URL}`);
    console.log(`Health: http://localhost:${PORT}/api/health`);
    console.log("========================================");
    console.log("");
});

for (const signal of ["SIGTERM", "SIGINT"]) {
    process.on(signal, () => {
        server.close(async () => {
            await pool.end();
            process.exit(0);
        });
    });
}
