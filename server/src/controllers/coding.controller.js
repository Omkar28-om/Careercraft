import pool from "../db.js";
import { getJudge0LanguageId } from "../config/judge0Languages.js";
import {
    submitToJudge0,
    pollJudge0Submission,
    compareOutputs,
} from "../services/judge0.service.js";
import { prepareCodeForExecution } from "../utils/codeHarness.js";
import { evaluateAchievements } from "../services/achievement.service.js";
import { createNotification } from "../services/notification.service.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/coding/problems
 * 
 * Public / Authenticated catalog of published coding problems.
 * Supports filters: difficulty, category, search.
 * Never returns hidden test cases or solution internals.
 */
export async function getCodingProblems(req, res) {
    try {
        const { difficulty, category, search } = req.query;

        let query = `
            SELECT 
                id,
                slug,
                title,
                difficulty,
                category,
                tags,
                is_published,
                created_at
            FROM coding_problems
            WHERE is_published = true
        `;
        const params = [];
        let paramIdx = 1;

        if (difficulty && ["Easy", "Medium", "Hard"].includes(difficulty)) {
            query += ` AND difficulty = $${paramIdx++}`;
            params.push(difficulty);
        }

        if (category && typeof category === "string" && category.trim()) {
            query += ` AND LOWER(category) = LOWER($${paramIdx++})`;
            params.push(category.trim());
        }

        if (search && typeof search === "string" && search.trim()) {
            query += ` AND (title ILIKE $${paramIdx} OR slug ILIKE $${paramIdx})`;
            params.push(`%${search.trim()}%`);
            paramIdx++;
        }

        query += ` ORDER BY created_at ASC`;

        const result = await pool.query(query, params);

        const problems = result.rows.map((row) => ({
            id: row.id,
            slug: row.slug,
            title: row.title,
            difficulty: row.difficulty,
            category: row.category,
            tags: row.tags,
            createdAt: row.created_at,
        }));

        return res.status(200).json({
            success: true,
            problems,
        });
    } catch (error) {
        console.error("getCodingProblems error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve coding problems",
        });
    }
}

/**
 * GET /api/coding/problems/:slug
 * 
 * Retrieves details for a specific published coding problem.
 * Exposes examples, constraints, starter code, and sample test cases only.
 * NEVER exposes hidden test cases.
 */
export async function getCodingProblem(req, res) {
    try {
        const { slug } = req.params;

        if (!slug || typeof slug !== "string") {
            return res.status(400).json({
                success: false,
                message: "Problem slug is required",
            });
        }

        // Query by slug (or by UUID if requested by id)
        const isUuid = UUID_REGEX.test(slug);
        const problemQuery = isUuid
            ? `SELECT id, slug, title, description, difficulty, category, tags, constraints,
                      input_format, output_format, examples, starter_code, created_at
               FROM coding_problems
               WHERE id = $1 AND is_published = true`
            : `SELECT id, slug, title, description, difficulty, category, tags, constraints,
                      input_format, output_format, examples, starter_code, created_at
               FROM coding_problems
               WHERE slug = $1 AND is_published = true`;

        const problemResult = await pool.query(problemQuery, [slug]);

        if (problemResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Coding problem not found",
            });
        }

        const p = problemResult.rows[0];

        // Fetch ONLY public sample test cases (never hidden)
        const testCasesResult = await pool.query(
            `SELECT id, input_data, expected_output, test_order
             FROM coding_test_cases
             WHERE problem_id = $1 AND is_sample = true AND is_hidden = false
             ORDER BY test_order ASC`,
            [p.id]
        );

        const sampleTestCases = testCasesResult.rows.map((tc) => ({
            id: tc.id,
            inputData: tc.input_data,
            input_data: tc.input_data,
            expectedOutput: tc.expected_output,
            expected_output: tc.expected_output,
            testOrder: tc.test_order,
        }));

        return res.status(200).json({
            success: true,
            problem: {
                id: p.id,
                slug: p.slug,
                title: p.title,
                description: p.description,
                difficulty: p.difficulty,
                category: p.category,
                tags: p.tags,
                constraints: p.constraints,
                inputFormat: p.input_format,
                outputFormat: p.output_format,
                examples: p.examples,
                starterCode: p.starter_code,
                starter_code: p.starter_code,
                sampleTestCases,
                testCases: sampleTestCases,
                createdAt: p.created_at,
            },
        });
    } catch (error) {
        console.error("getCodingProblem error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve coding problem details",
        });
    }
}

/**
 * POST /api/coding/problems/:problemId/submissions
 * 
 * Authenticated submission endpoint with Judge0 CE remote code execution.
 * - Validates input and language
 * - Creates database submission record
 * - Executes test cases on Judge0 remotely
 * - Evaluates deterministic output
 * - Updates submission status, metrics, and user problem progress
 * - Awards solved-problem XP only on first accepted solve
 * - Evaluates achievements
 */
export async function createSubmission(req, res) {
    let submissionId = null;
    try {
        const userId = req.user.id;
        const { problemId } = req.params;
        const { language, source_code, sourceCode } = req.body;

        const codeToSubmit = typeof source_code === "string" ? source_code : sourceCode;

        if (!problemId || !UUID_REGEX.test(problemId)) {
            return res.status(400).json({
                success: false,
                message: "Valid problem UUID is required",
            });
        }

        // Validate language against verified Judge0 languages
        const judge0LanguageId = getJudge0LanguageId(language);
        if (!judge0LanguageId) {
            return res.status(400).json({
                success: false,
                message: "Unsupported programming language",
            });
        }

        // Validate code presence and size
        if (!codeToSubmit || typeof codeToSubmit !== "string" || codeToSubmit.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Source code cannot be empty",
            });
        }

        if (codeToSubmit.length > 65536) {
            return res.status(400).json({
                success: false,
                message: "Source code exceeds maximum allowed length of 64KB",
            });
        }

        // Verify problem exists and is published
        const problemRes = await pool.query(
            "SELECT id, slug, title, difficulty FROM coding_problems WHERE id = $1 AND is_published = true",
            [problemId]
        );

        if (problemRes.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Coding problem not found or not published",
            });
        }

        const problem = problemRes.rows[0];

        // Fetch all test cases for this problem (both sample and hidden) server-side
        const testCasesRes = await pool.query(
            `SELECT id, input_data, expected_output, is_sample, is_hidden, test_order
             FROM coding_test_cases
             WHERE problem_id = $1
             ORDER BY test_order ASC`,
            [problem.id]
        );
        const testCases = testCasesRes.rows;

        // Check if user had already solved this problem before this submission
        const existingProgressRes = await pool.query(
            "SELECT status FROM coding_problem_progress WHERE user_id = $1 AND problem_id = $2",
            [userId, problem.id]
        );
        const wasAlreadySolved = existingProgressRes.rows[0]?.status === "solved";

        // 1. Create initial submission record with status 'pending'
        const initialSubRes = await pool.query(
            `INSERT INTO coding_submissions (
                user_id, problem_id, language, source_code, status,
                test_cases_passed, test_cases_total, submitted_at
            )
            VALUES ($1, $2, $3, $4, 'pending', 0, $5, NOW())
            RETURNING id, submitted_at`,
            [userId, problem.id, language.toLowerCase().trim(), codeToSubmit, testCases.length]
        );
        submissionId = initialSubRes.rows[0].id;
        const submittedAt = initialSubRes.rows[0].submitted_at;

        // 2. Track user attempt in coding_problem_progress
        await pool.query(
            `INSERT INTO coding_problem_progress (
                user_id, problem_id, status, attempts, created_at, updated_at
            )
            VALUES ($1, $2, 'attempted', 1, NOW(), NOW())
            ON CONFLICT (user_id, problem_id) DO UPDATE SET
                attempts = coding_problem_progress.attempts + 1,
                updated_at = NOW()`,
            [userId, problem.id]
        );

        // 3. Mark submission as 'running'
        await pool.query(
            "UPDATE coding_submissions SET status = 'running' WHERE id = $1",
            [submissionId]
        );

        // 4. Remote Execution via Judge0 CE
        let finalStatus = "accepted";
        let passedCount = 0;
        let totalExecutionTimeMs = 0;
        let maxMemoryKb = 0;
        let lastJudgeToken = null;
        let errorMessage = null;

        try {
            if (testCases.length === 0) {
                // If no test cases exist in DB, execute once with empty input to verify compilation/runtime
                const { code, stdin } = prepareCodeForExecution({
                    slug: problem.slug,
                    language: language.toLowerCase().trim(),
                    sourceCode: codeToSubmit,
                    inputData: "",
                });

                const judgeSubmit = await submitToJudge0({
                    sourceCode: code,
                    languageId: judge0LanguageId,
                    stdin,
                    cpuTimeLimit: 5,
                    memoryLimit: 128000,
                });
                lastJudgeToken = judgeSubmit.token;

                const result = await pollJudge0Submission(judgeSubmit.token);
                const statusId = result?.status?.id;

                if (statusId === 6) {
                    finalStatus = "compilation_error";
                    errorMessage = result.compile_output || result.stderr || "Compilation failed";
                } else if (statusId === 5) {
                    finalStatus = "time_limit";
                    errorMessage = "Time limit exceeded";
                } else if (statusId >= 7 && statusId <= 12) {
                    finalStatus = "runtime_error";
                    errorMessage = result.stderr || result.message || "Runtime error occurred";
                } else if (statusId === 13 || statusId === 14) {
                    finalStatus = "internal_error";
                    errorMessage = "Internal execution error";
                } else {
                    finalStatus = "accepted";
                }
            } else {
                // Execute each test case sequentially
                for (let i = 0; i < testCases.length; i++) {
                    const tc = testCases[i];

                    const { code, stdin } = prepareCodeForExecution({
                        slug: problem.slug,
                        language: language.toLowerCase().trim(),
                        sourceCode: codeToSubmit,
                        inputData: tc.input_data,
                    });

                    const judgeSubmit = await submitToJudge0({
                        sourceCode: code,
                        languageId: judge0LanguageId,
                        stdin,
                        expectedOutput: tc.expected_output,
                        cpuTimeLimit: 5,
                        memoryLimit: 128000,
                    });
                    lastJudgeToken = judgeSubmit.token;

                    const result = await pollJudge0Submission(judgeSubmit.token);

                    const runTimeSec = parseFloat(result.time || "0");
                    totalExecutionTimeMs += Math.round(runTimeSec * 1000);
                    if (result.memory) {
                        maxMemoryKb = Math.max(maxMemoryKb, result.memory);
                    }

                    const statusId = result?.status?.id;

                    if (statusId === 6) {
                        finalStatus = "compilation_error";
                        errorMessage = result.compile_output || result.stderr || "Compilation failed";
                        break;
                    } else if (statusId === 5) {
                        finalStatus = "time_limit";
                        errorMessage = "Time limit exceeded";
                        break;
                    } else if (statusId >= 7 && statusId <= 12) {
                        finalStatus = "runtime_error";
                        errorMessage = result.stderr || result.message || "Runtime error";
                        break;
                    } else if (statusId === 13 || statusId === 14) {
                        finalStatus = "internal_error";
                        errorMessage = "Internal execution error";
                        break;
                    }

                    // Status 3 (Accepted) or 4 (Wrong Answer) - evaluate actual output deterministically
                    const actualOut = result.stdout || "";
                    const isPassed = compareOutputs(actualOut, tc.expected_output);

                    if (isPassed) {
                        passedCount++;
                    } else {
                        finalStatus = "wrong_answer";
                        errorMessage = `Failed on test case ${i + 1}`;
                        break;
                    }
                }

                if (passedCount === testCases.length && testCases.length > 0) {
                    finalStatus = "accepted";
                } else if (finalStatus === "accepted") {
                    finalStatus = "wrong_answer";
                }
            }
        } catch (execErr) {
            console.error("Judge0 execution failure:", execErr.message);
            finalStatus = "internal_error";
            errorMessage = "Code execution service is temporarily unavailable. Please try again.";
        }

        // 5. Update submission record in database
        await pool.query(
            `UPDATE coding_submissions
             SET status = $1,
                 execution_time_ms = $2,
                 memory_kb = $3,
                 test_cases_passed = $4,
                 test_cases_total = $5,
                 error_message = $6,
                 judge_submission_id = $7
             WHERE id = $8`,
            [
                finalStatus,
                totalExecutionTimeMs,
                maxMemoryKb,
                passedCount,
                testCases.length,
                errorMessage,
                lastJudgeToken,
                submissionId,
            ]
        );

        // 6. Update user problem progress
        if (finalStatus === "accepted") {
            await pool.query(
                `UPDATE coding_problem_progress
                 SET status = 'solved',
                     best_submission_id = $1,
                     solved_at = COALESCE(solved_at, NOW()),
                     updated_at = NOW()
                 WHERE user_id = $2 AND problem_id = $3`,
                [submissionId, userId, problem.id]
            );
        } else if (!wasAlreadySolved) {
            // Keep status as 'attempted' if not previously solved
            await pool.query(
                `UPDATE coding_problem_progress
                 SET status = 'attempted',
                     updated_at = NOW()
                 WHERE user_id = $1 AND problem_id = $2`,
                [userId, problem.id]
            );
        }

        // 7. Solved-Problem XP & Achievement Evaluation (ONLY on first accepted solve)
        let xpAwarded = 0;
        const isFirstSolve = finalStatus === "accepted" && !wasAlreadySolved;

        if (isFirstSolve) {
            // XP reward based on problem difficulty
            const XP_BY_DIFFICULTY = {
                Easy: 10,
                Medium: 20,
                Hard: 30,
            };
            xpAwarded = XP_BY_DIFFICULTY[problem.difficulty] || 10;

            const client = await pool.connect();
            try {
                await client.query("BEGIN");

                // Ensure student_progress row exists and update stats
                await client.query(
                    `INSERT INTO student_progress (
                        user_id, total_xp, current_streak, longest_streak,
                        problems_solved, courses_completed, projects_completed,
                        created_at, updated_at
                    )
                    VALUES ($1, $2, 0, 0, 1, 0, 0, NOW(), NOW())
                    ON CONFLICT (user_id) DO UPDATE SET
                        total_xp = student_progress.total_xp + $2,
                        problems_solved = student_progress.problems_solved + 1,
                        updated_at = NOW()`,
                    [userId, xpAwarded]
                );

                // Record user activity
                await client.query(
                    `INSERT INTO user_activity (
                        user_id, activity_type, title, description, xp_earned, metadata, created_at
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
                    [
                        userId,
                        "problem_solved",
                        `Solved ${problem.title}`,
                        `Successfully solved ${problem.title} (${problem.difficulty})`,
                        xpAwarded,
                        JSON.stringify({
                            problemId: problem.id,
                            slug: problem.slug,
                            difficulty: problem.difficulty,
                            language: language.toLowerCase().trim(),
                            submissionId,
                        }),
                    ]
                );

                // Create notification for first accepted problem solve inside transaction
                await createNotification({
                    client,
                    userId,
                    type: "coding_accepted",
                    title: "Problem solved",
                    message: `You solved ${problem.title}.`,
                    link: `/coding/problems/${problem.slug}`,
                    metadata: {
                        problemId: problem.id,
                        problemSlug: problem.slug,
                        problemTitle: problem.title,
                        difficulty: problem.difficulty,
                    },
                    eventKey: `coding_accepted:${userId}:${problem.id}`,
                });

                await client.query("COMMIT");
            } catch (xpErr) {
                await client.query("ROLLBACK");
                console.error("Failed to award solved XP:", xpErr);
            } finally {
                client.release();
            }

            // Run existing achievement evaluation system asynchronously
            try {
                await evaluateAchievements(userId);
            } catch (achErr) {
                console.error("Achievement evaluation error after solve:", achErr);
            }
        }

        // 8. Return safe API response (never exposing Judge0 API keys or hidden test internals)
        return res.status(200).json({
            success: true,
            submission: {
                id: submissionId,
                problemId: problem.id,
                problem_id: problem.id,
                language: language.toLowerCase().trim(),
                status: finalStatus,
                testsPassed: passedCount,
                tests_passed: passedCount,
                testsTotal: testCases.length,
                tests_total: testCases.length,
                executionTimeMs: totalExecutionTimeMs,
                execution_time_ms: totalExecutionTimeMs,
                memoryKb: maxMemoryKb,
                memory_kb: maxMemoryKb,
                errorMessage,
                error_message: errorMessage,
                submittedAt,
                submitted_at: submittedAt,
            },
            xpAwarded,
            isFirstSolve,
        });
    } catch (error) {
        console.error("createSubmission error:", error);

        // Update submission to internal_error if it was created
        if (submissionId) {
            try {
                await pool.query(
                    "UPDATE coding_submissions SET status = 'internal_error', error_message = $1 WHERE id = $2",
                    ["Unexpected submission processing error", submissionId]
                );
            } catch {}
        }

        return res.status(500).json({
            success: false,
            message: "Failed to process coding submission",
        });
    }
}

/**
 * GET /api/coding/submissions
 * 
 * Returns only the authenticated user's submissions.
 * Optional filter by problemId.
 */
export async function getUserSubmissions(req, res) {
    try {
        const userId = req.user.id;
        const { problemId, limit = 50 } = req.query;

        const maxLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
        let query = `
            SELECT 
                s.id,
                s.problem_id,
                p.title AS problem_title,
                p.slug AS problem_slug,
                s.language,
                s.source_code,
                s.status,
                s.execution_time_ms,
                s.memory_kb,
                s.test_cases_passed,
                s.test_cases_total,
                s.error_message,
                s.submitted_at
            FROM coding_submissions s
            JOIN coding_problems p ON s.problem_id = p.id
            WHERE s.user_id = $1
        `;
        const params = [userId];

        if (problemId && UUID_REGEX.test(problemId)) {
            query += ` AND s.problem_id = $2`;
            params.push(problemId);
        }

        query += ` ORDER BY s.submitted_at DESC LIMIT $${params.length + 1}`;
        params.push(maxLimit);

        const result = await pool.query(query, params);

        const submissions = result.rows.map((row) => ({
            id: row.id,
            problemId: row.problem_id,
            problem_id: row.problem_id,
            problemTitle: row.problem_title,
            problemSlug: row.problem_slug,
            language: row.language,
            sourceCode: row.source_code,
            source_code: row.source_code,
            status: row.status,
            executionTimeMs: row.execution_time_ms,
            memoryKb: row.memory_kb,
            testCasesPassed: row.test_cases_passed,
            testCasesTotal: row.test_cases_total,
            errorMessage: row.error_message,
            submittedAt: row.submitted_at,
            submitted_at: row.submitted_at,
        }));

        return res.status(200).json({
            success: true,
            submissions,
        });
    } catch (error) {
        console.error("getUserSubmissions error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve submissions",
        });
    }
}

/**
 * GET /api/coding/problems/:problemId/progress
 * 
 * Returns only the authenticated user's progress for a problem.
 */
export async function getProblemProgress(req, res) {
    try {
        const userId = req.user.id;
        const { problemId } = req.params;

        if (!problemId || !UUID_REGEX.test(problemId)) {
            return res.status(400).json({
                success: false,
                message: "Valid problem UUID is required",
            });
        }

        const result = await pool.query(
            `SELECT status, attempts, solved_at, best_submission_id
             FROM coding_problem_progress
             WHERE user_id = $1 AND problem_id = $2`,
            [userId, problemId]
        );

        if (result.rows.length === 0) {
            return res.status(200).json({
                success: true,
                progress: {
                    status: "not_attempted",
                    attempts: 0,
                    solvedAt: null,
                    solved_at: null,
                },
            });
        }

        const row = result.rows[0];

        return res.status(200).json({
            success: true,
            progress: {
                status: row.status,
                attempts: row.attempts,
                solvedAt: row.solved_at,
                solved_at: row.solved_at,
                bestSubmissionId: row.best_submission_id,
            },
        });
    } catch (error) {
        console.error("getProblemProgress error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve problem progress",
        });
    }
}
