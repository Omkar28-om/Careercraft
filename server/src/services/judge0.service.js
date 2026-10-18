import dotenv from "dotenv";

dotenv.config();

const BASE_URL = process.env.JUDGE0_BASE_URL || "https://ce.judge0.com";
const API_KEY = process.env.JUDGE0_API_KEY || "";
const DEFAULT_POLL_INTERVAL_MS = parseInt(process.env.JUDGE0_POLL_INTERVAL_MS, 10) || 1000;
const DEFAULT_MAX_POLL_ATTEMPTS = parseInt(process.env.JUDGE0_MAX_POLL_ATTEMPTS, 10) || 15;

/**
 * Builds request headers for Judge0 requests.
 * Supports RapidAPI and self-hosted instances without exposing credentials to frontend.
 */
function getJudge0Headers() {
    const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
    };

    if (API_KEY) {
        if (BASE_URL.includes("rapidapi.com")) {
            headers["X-RapidAPI-Key"] = API_KEY;
            try {
                const url = new URL(BASE_URL);
                headers["X-RapidAPI-Host"] = url.host;
            } catch {
                headers["X-RapidAPI-Host"] = "judge0-ce.p.rapidapi.com";
            }
        } else {
            headers["X-Auth-Token"] = API_KEY;
        }
    }

    return headers;
}

/**
 * Submits source code to Judge0 for remote execution.
 *
 * @param {Object} options
 * @param {string} options.sourceCode - Complete source code to compile and run
 * @param {number} options.languageId - Trusted Judge0 language ID
 * @param {string} [options.stdin] - Input data provided on stdin
 * @param {string} [options.expectedOutput] - Expected output string
 * @param {number} [options.cpuTimeLimit=5] - Maximum CPU execution time in seconds
 * @param {number} [options.memoryLimit=128000] - Memory limit in KB
 * @returns {Promise<Object>} Submission response containing token
 */
export async function submitToJudge0({
    sourceCode,
    languageId,
    stdin = "",
    expectedOutput = "",
    cpuTimeLimit = 5,
    memoryLimit = 128000,
}) {
    if (!BASE_URL) {
        throw new Error("JUDGE0_BASE_URL is not configured.");
    }

    const payload = {
        source_code: sourceCode,
        language_id: languageId,
        stdin: typeof stdin === "string" ? stdin : String(stdin || ""),
        cpu_time_limit: Math.min(10, Math.max(1, cpuTimeLimit)),
        memory_limit: Math.min(256000, Math.max(16000, memoryLimit)),
    };

    if (expectedOutput && typeof expectedOutput === "string") {
        payload.expected_output = expectedOutput;
    }

    const endpoint = `${BASE_URL.replace(/\/+$/, "")}/submissions?base64_encoded=false&wait=false`;

    const response = await fetch(endpoint, {
        method: "POST",
        headers: getJudge0Headers(),
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(`Judge0 submission failed [HTTP ${response.status}]: ${errText || response.statusText}`);
    }

    const data = await response.json();
    if (!data || !data.token) {
        throw new Error("Judge0 response did not include a submission token.");
    }

    return data;
}

/**
 * Retrieves the status and result of a Judge0 submission.
 *
 * @param {string} token - Judge0 submission UUID token
 * @returns {Promise<Object>} Submission execution status
 */
export async function getJudge0Submission(token) {
    if (!token || typeof token !== "string") {
        throw new Error("A valid Judge0 submission token is required.");
    }

    const endpoint = `${BASE_URL.replace(/\/+$/, "")}/submissions/${encodeURIComponent(token)}?base64_encoded=false`;

    const response = await fetch(endpoint, {
        method: "GET",
        headers: getJudge0Headers(),
    });

    if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(`Judge0 retrieval failed [HTTP ${response.status}]: ${errText || response.statusText}`);
    }

    return await response.json();
}

/**
 * Polls Judge0 until a terminal status is returned or timeout occurs.
 *
 * Terminal status IDs:
 * 1 = In Queue, 2 = Processing (Non-terminal)
 * 3 = Accepted, 4 = Wrong Answer, 5 = Time Limit, 6 = Compilation Error, etc. (Terminal)
 *
 * @param {string} token - Judge0 submission token
 * @param {Object} [options]
 * @param {number} [options.intervalMs] - Polling delay in ms
 * @param {number} [options.maxAttempts] - Maximum attempts before timing out
 * @returns {Promise<Object>} Completed submission object
 */
export async function pollJudge0Submission(token, options = {}) {
    const intervalMs = options.intervalMs || DEFAULT_POLL_INTERVAL_MS;
    const maxAttempts = options.maxAttempts || DEFAULT_MAX_POLL_ATTEMPTS;

    let attempts = 0;

    while (attempts < maxAttempts) {
        attempts++;
        const submission = await getJudge0Submission(token);

        const statusId = submission?.status?.id;

        // IDs 1 (In Queue) and 2 (Processing) mean it is still executing
        if (statusId !== 1 && statusId !== 2) {
            return submission;
        }

        // Wait before polling again
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    throw new Error(`Execution polling timed out after ${maxAttempts} attempts (${(maxAttempts * intervalMs) / 1000}s).`);
}

/**
 * Normalizes text output for deterministic comparison.
 * Trims line-endings, trailing spaces, and outer whitespace.
 *
 * @param {string} str - Raw output string
 * @returns {string} Normalized string
 */
export function normalizeOutput(str) {
    if (typeof str !== "string") return "";
    return str
        .replace(/\r\n/g, "\n")
        .replace(/[ \t]+$/gm, "")
        .trim();
}

/**
 * Deterministically compares actual stdout against expected output.
 *
 * @param {string} actual - Program stdout
 * @param {string} expected - Expected output
 * @returns {boolean} True if matching
 */
export function compareOutputs(actual, expected) {
    return normalizeOutput(actual) === normalizeOutput(expected);
}

/**
 * Maps Judge0 status IDs to CareerCraft database submission statuses.
 *
 * @param {number} statusId - Judge0 status ID
 * @returns {string} CareerCraft status string
 */
export function mapJudge0StatusToCareerCraft(statusId) {
    switch (statusId) {
        case 3:
            return "accepted";
        case 4:
            return "wrong_answer";
        case 5:
            return "time_limit";
        case 6:
            return "compilation_error";
        case 7:
        case 8:
        case 9:
        case 10:
        case 11:
        case 12:
            return "runtime_error";
        case 13:
        case 14:
            return "internal_error";
        default:
            return "internal_error";
    }
}
