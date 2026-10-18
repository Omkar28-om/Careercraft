import pool from "../db.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Sanitizes details payload so that no sensitive data (passwords, hashes, tokens)
 * can ever be stored in audit records.
 */
function sanitizeAuditDetails(details) {
    if (!details || typeof details !== "object") return {};
    const sanitized = { ...details };
    const SENSITIVE_KEYS = ["password", "password_hash", "passwordHash", "token", "secret", "cookie", "jwt"];
    for (const key of Object.keys(sanitized)) {
        if (SENSITIVE_KEYS.some((s) => key.toLowerCase().includes(s.toLowerCase()))) {
            delete sanitized[key];
        }
    }
    return sanitized;
}

/**
 * Appends an audit log entry for an administrative mutation.
 * 
 * @param {Object} params
 * @param {Object} [params.client] - Optional pg client from active transaction
 * @param {string} params.adminId - Authenticated administrator UUID
 * @param {string} params.action - Action identifier (e.g. USER_SUSPENDED)
 * @param {string} params.entityType - Type of target entity (e.g. user, course, job)
 * @param {string} [params.entityId] - UUID of the target entity
 * @param {Object} [params.details] - Non-sensitive audit metadata
 */
export async function recordAdminAction({
    client,
    adminId,
    action,
    entityType,
    entityId = null,
    details = {},
}) {
    if (!adminId || !UUID_REGEX.test(adminId)) {
        throw new Error("Invalid admin ID for audit logging");
    }

    if (!action || typeof action !== "string" || !action.trim()) {
        throw new Error("Action name is required for audit logging");
    }

    if (!entityType || typeof entityType !== "string" || !entityType.trim()) {
        throw new Error("Entity type is required for audit logging");
    }

    const cleanAction = action.trim().toUpperCase();
    const cleanEntityType = entityType.trim().toLowerCase();
    const validEntityId = entityId && UUID_REGEX.test(entityId) ? entityId : null;
    const safeDetails = sanitizeAuditDetails(details);

    const db = client || pool;

    const res = await db.query(
        `INSERT INTO admin_audit_logs (
            admin_id, action, entity_type, entity_id, details, created_at
        )
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING id, admin_id, action, entity_type, entity_id, details, created_at`,
        [adminId, cleanAction, cleanEntityType, validEntityId, JSON.stringify(safeDetails)]
    );

    return res.rows[0];
}

/**
 * Queries paginated audit logs for administrators.
 */
export async function getAuditLogs({
    action,
    entityType,
    adminId,
    page = 1,
    limit = 20,
}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    const params = [];

    if (action && typeof action === "string" && action.trim()) {
        params.push(action.trim().toUpperCase());
        conditions.push(`l.action = $${params.length}`);
    }

    if (entityType && typeof entityType === "string" && entityType.trim()) {
        params.push(entityType.trim().toLowerCase());
        conditions.push(`l.entity_type = $${params.length}`);
    }

    if (adminId && UUID_REGEX.test(adminId)) {
        params.push(adminId);
        conditions.push(`l.admin_id = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countQuery = `SELECT COUNT(*)::int AS count FROM admin_audit_logs l ${whereClause}`;
    const totalRes = await pool.query(countQuery, params);
    const total = totalRes.rows[0]?.count || 0;

    const queryParams = [...params, limitNum, offset];
    const dataQuery = `
        SELECT 
            l.id,
            l.admin_id,
            l.action,
            l.entity_type,
            l.entity_id,
            l.details,
            l.created_at,
            u.name AS admin_name,
            u.email AS admin_email
        FROM admin_audit_logs l
        JOIN users u ON l.admin_id = u.id
        ${whereClause}
        ORDER BY l.created_at DESC
        LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
    `;

    const result = await pool.query(dataQuery, queryParams);

    const logs = result.rows.map((r) => ({
        id: r.id,
        adminId: r.admin_id,
        admin: {
            id: r.admin_id,
            name: r.admin_name,
            email: r.admin_email,
        },
        action: r.action,
        entityType: r.entity_type,
        entityId: r.entity_id,
        details: r.details,
        createdAt: r.created_at,
        timestamp: r.created_at,
    }));

    return {
        logs,
        pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum) || 1,
        },
    };
}
