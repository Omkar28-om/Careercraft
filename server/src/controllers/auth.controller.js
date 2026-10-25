import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../db.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

// ======================================================
// REGISTER
// ======================================================
export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // 1. Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email, and password are required",
            });
        }

        const trimmedName = typeof name === "string" ? name.trim() : "";
        const trimmedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

        if (!trimmedName) {
            return res.status(400).json({
                success: false,
                message: "Name cannot be empty",
            });
        }
        if (trimmedName.length > 100) {
            return res.status(400).json({ success: false, message: "Name must be 100 characters or fewer" });
        }

        // 2. Validate email format
        if (!EMAIL_REGEX.test(trimmedEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address",
            });
        }
        if (trimmedEmail.length > 255) {
            return res.status(400).json({ success: false, message: "Email must be 255 characters or fewer" });
        }

        // 3. Validate password length (min 8 characters)
        if (typeof password !== "string" || password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long",
            });
        }
        if (Buffer.byteLength(password, "utf8") > 72) {
            return res.status(400).json({
                success: false,
                message: "Password must be 72 bytes or fewer",
            });
        }

        // 4. Check for duplicate email
        const existingUser = await pool.query(
            "SELECT id FROM users WHERE LOWER(email) = LOWER($1)",
            [trimmedEmail]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists",
            });
        }

        // 5. Hash password with bcryptjs
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(password, salt);

        // 6. Insert user into PostgreSQL (never store plain password, never return password_hash)
        const result = await pool.query(
            `INSERT INTO users (name, email, password_hash)
             VALUES ($1, $2, $3)
             RETURNING id, name, email, role, created_at, updated_at`,
            [trimmedName, trimmedEmail, passwordHash]
        );

        const newUser = result.rows[0];

        // Ensure user has a profile record initialized
        await pool.query(
            "INSERT INTO profiles (id) VALUES ($1) ON CONFLICT (id) DO NOTHING",
            [newUser.id]
        );

        // 7. Generate JWT and store in HTTP-only cookie
        const token = jwt.sign(
            { userId: newUser.id, email: newUser.email, role: newUser.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.cookie("token", token, getCookieOptions());

        const safeUser = {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            career_domain: null,
            created_at: newUser.created_at,
            updated_at: newUser.updated_at,
        };

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            token,
            user: safeUser,
        });
    } catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred during registration",
        });
    }
};

// ======================================================
// LOGIN
// ======================================================
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const trimmedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
        if (!EMAIL_REGEX.test(trimmedEmail) || trimmedEmail.length > 255 || typeof password !== "string") {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address and password",
            });
        }

        // 2. Find user by email
        const result = await pool.query(
            `SELECT u.id, u.name, u.email, u.password_hash, u.role, u.created_at, u.updated_at, p.career_domain
             FROM users u
             LEFT JOIN profiles p ON u.id = p.id
             WHERE LOWER(u.email) = LOWER($1)`,
            [trimmedEmail]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const user = result.rows[0];

        // 3. Compare password using bcrypt
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // 4. Generate JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // 5. Store JWT in HTTP-only cookie
        res.cookie("token", token, getCookieOptions());

        // 6. Return safe user data only (exclude password_hash)
        const safeUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            career_domain: user.career_domain || null,
            created_at: user.created_at,
            updated_at: user.updated_at,
        };

        return res.status(200).json({
            success: true,
            message: "Logged in successfully",
            token,
            user: safeUser,
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred during login",
        });
    }
};

// ======================================================
// LOGOUT
// ======================================================
export const logout = async (req, res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        });

        return res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred during logout",
        });
    }
};

// ======================================================
// GET ME
// ======================================================
export const getMe = async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            user: req.user || null,
        });
    } catch (error) {
        console.error("GetMe error:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while fetching user profile",
        });
    }
};


