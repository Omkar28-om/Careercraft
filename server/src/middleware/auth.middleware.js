import jwt from "jsonwebtoken";
import pool from "../db.js";

export const authenticate = async (req, res, next) => {
    try {
        let token = req.cookies?.token;
        if (!token && req.headers.authorization?.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const result = await pool.query(
            `SELECT u.id, u.name, u.email, u.role, u.status, u.created_at, u.updated_at, p.career_domain
             FROM users u
             LEFT JOIN profiles p ON u.id = p.id
             WHERE u.id = $1`,
            [decoded.userId || decoded.id]
        );

        if (result.rows.length === 0) {
            res.clearCookie("token", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            });

            return res.status(401).json({
                success: false,
                message: "User no longer exists",
            });
        }

        if (result.rows[0].status === "suspended") {
            return res.status(403).json({
                success: false,
                message: "Account is suspended. Access denied.",
            });
        }

        req.user = result.rows[0];
        next();
    } catch (error) {
        if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token",
            });
        }

        console.error("Auth middleware error:", error);
        return res.status(500).json({
            success: false,
            message: "Authentication error",
        });
    }
};

export const optionalAuthenticate = async (req, res, next) => {
    try {
        let token = req.cookies?.token;
        if (!token && req.headers.authorization?.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        }
        if (!token) {
            req.user = null;
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const result = await pool.query(
            `SELECT u.id, u.name, u.email, u.role, u.status, p.career_domain
             FROM users u
             LEFT JOIN profiles p ON u.id = p.id
             WHERE u.id = $1`,
            [decoded.userId || decoded.id]
        );

        if (result.rows.length > 0 && result.rows[0].status !== "suspended") {
            req.user = result.rows[0];
        } else {
            req.user = null;
        }
        next();
    } catch {
        req.user = null;
        next();
    }
};
