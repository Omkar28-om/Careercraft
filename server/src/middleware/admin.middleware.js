import pool from "../db.js";

/**
 * Middleware to strictly require an administrator role.
 * 
 * Verifies live database state for req.user.id to ensure:
 * 1. User actually exists and is active.
 * 2. Role is strictly 'admin'.
 * 3. Cannot be bypassed via client-side claims or spoofed tokens.
 */
export async function requireAdmin(req, res, next) {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const result = await pool.query(
            "SELECT id, name, email, role, status FROM users WHERE id = $1",
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "User not found",
            });
        }

        const user = result.rows[0];

        if (user.status === "suspended") {
            return res.status(403).json({
                success: false,
                message: "Account is suspended. Administrator access denied.",
            });
        }

        if (user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Access denied. Administrator privileges required.",
            });
        }

        // Attach verified admin user record
        req.adminUser = user;
        next();
    } catch (error) {
        console.error("requireAdmin middleware error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to authorize administrative request",
        });
    }
}
