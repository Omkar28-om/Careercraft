/**
 * CareerCraft — STEP 10: Courses & Learning Platform Automated Test Suite
 * Validates requirements A through R:
 * - Public course listing (200)
 * - Unpublished courses hidden from public
 * - Course detail (200)
 * - Lesson detail preview access rules (preview vs enrolled)
 * - Unauthenticated enrollment (401)
 * - Authenticated enrollment (200)
 * - Duplicate enrollment idempotency (no duplicate rows)
 * - Lesson completion without enrollment (403)
 * - Enrolled lesson completion (200)
 * - Repeated lesson completion (no duplicate XP)
 * - Course progress calculation accuracy
 * - Complete all lessons transitions course status to completed
 * - courses_completed increments exactly once
 * - Course completion XP (+25 XP) awarded exactly once
 * - Another user cannot see or modify User A lesson progress
 * - Client XP tampering ignored/rejected
 * - Client progress tampering ignored/rejected
 * - password_hash never exposed
 */

import pool from "./src/db.js";
import crypto from "crypto";

const BASE_URL = "http://localhost:5000/api";

function extractCookie(res) {
    const setCookie = res.headers.get("set-cookie");
    if (!setCookie) return null;
    const match = setCookie.match(/token=([^;]+)/);
    return match ? `token=${match[1]}` : null;
}

async function registerTestUser(prefix) {
    const rand = crypto.randomBytes(4).toString("hex");
    const email = `${prefix}_${rand}@example.com`;
    const password = "Password123!";
    const name = `Test ${prefix} ${rand}`;

    const res = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, role: "student" }),
    });

    const data = await res.json();
    const cookie = extractCookie(res);
    return { id: data.user?.id, email, password, cookie, data };
}

async function runTests() {
    console.log("=== STARTING STEP 10 COURSES & LEARNING PLATFORM TESTS ===");

    const userA = await registerTestUser("user_a_c10");
    const userB = await registerTestUser("user_b_c10");
    console.log(`✅ Registered User A: ${userA.id}`);
    console.log(`✅ Registered User B: ${userB.id}`);

    // Create an unpublished test course directly in DB to verify isolation
    const unpubSlug = `test-unpublished-${Date.now()}`;
    const unpubCourseRes = await pool.query(
        `INSERT INTO courses (title, slug, description, category, level, instructor_name, duration_minutes, is_published)
         VALUES ('Unpublished Course', $1, 'Secret draft course', 'Programming Languages', 'beginner', 'Test Instructor', 60, false)
         RETURNING id, slug`,
        [unpubSlug]
    );
    const unpubCourse = unpubCourseRes.rows[0];

    // TEST A: Public course listing
    const resA = await fetch(`${BASE_URL}/courses`);
    const dataA = await resA.json();
    if (resA.status === 200 && Array.isArray(dataA.courses) && dataA.courses.length >= 5) {
        console.log(`✅ TEST A PASSED: Public course listing returned status 200 with ${dataA.courses.length} courses`);
    } else {
        throw new Error(`TEST A FAILED: status=${resA.status}, courses=${dataA.courses?.length}`);
    }

    // TEST B: Unpublished course not visible publicly
    const foundUnpub = dataA.courses.find((c) => c.slug === unpubSlug);
    const resBDetail = await fetch(`${BASE_URL}/courses/${unpubSlug}`);
    if (!foundUnpub && resBDetail.status === 404) {
        console.log("✅ TEST B PASSED: Unpublished course is not visible in catalog (filtered) and returns 404 on direct detail");
    } else {
        throw new Error(`TEST B FAILED: Unpublished course exposed! Found in list: ${Boolean(foundUnpub)}, Detail status: ${resBDetail.status}`);
    }

    // TEST C: Course detail returns 200 with sections and lesson summaries
    const testSlug = "python-programming-fundamentals";
    const resC = await fetch(`${BASE_URL}/courses/${testSlug}`);
    const dataC = await resC.json();
    if (
        resC.status === 200 &&
        dataC.course &&
        Array.isArray(dataC.course.sections) &&
        dataC.course.sections.length >= 2 &&
        dataC.course.sections[0].lessons.length >= 1
    ) {
        console.log(`✅ TEST C PASSED: Course detail returned status 200 with ${dataC.course.sections.length} sections and structured lessons`);
    } else {
        throw new Error(`TEST C FAILED: status=${resC.status}, sections=${dataC.course?.sections?.length}`);
    }

    const testCourseId = dataC.course.id;
    const previewLesson = dataC.course.sections[0].lessons.find((l) => l.isPreview);
    const nonPreviewLesson = dataC.course.sections[0].lessons.find((l) => !l.isPreview);

    if (!previewLesson || !nonPreviewLesson) {
        throw new Error("Seed data missing preview or non-preview lesson in section 1");
    }

    // TEST D: Lesson detail preview access rules
    // Public user can access preview lesson
    const resDPreview = await fetch(`${BASE_URL}/courses/${testSlug}/lessons/${previewLesson.slug}`);
    const dataDPreview = await resDPreview.json();
    if (resDPreview.status === 200 && dataDPreview.lesson?.content) {
        console.log("✅ TEST D.1 PASSED: Public user can access preview lesson (is_preview = true)");
    } else {
        throw new Error(`TEST D.1 FAILED: Preview lesson access failed status=${resDPreview.status}`);
    }

    // Public user rejected from non-preview lesson
    const resDLocked = await fetch(`${BASE_URL}/courses/${testSlug}/lessons/${nonPreviewLesson.slug}`);
    if (resDLocked.status === 401) {
        console.log("✅ TEST D.2 PASSED: Unauthenticated user rejected with 401 from non-preview lesson");
    } else {
        throw new Error(`TEST D.2 FAILED: Non-preview lesson should return 401, got ${resDLocked.status}`);
    }

    // User A authenticated but not yet enrolled rejected with 403
    const resD403 = await fetch(`${BASE_URL}/courses/${testSlug}/lessons/${nonPreviewLesson.slug}`, {
        headers: { Cookie: userA.cookie },
    });
    if (resD403.status === 403) {
        console.log("✅ TEST D.3 PASSED: Authenticated non-enrolled user rejected with 403 from non-preview lesson");
    } else {
        throw new Error(`TEST D.3 FAILED: Authenticated non-enrolled access should return 403, got ${resD403.status}`);
    }

    // TEST E: Unauthenticated enrollment rejected with 401
    const resE = await fetch(`${BASE_URL}/courses/${testCourseId}/enroll`, {
        method: "POST",
    });
    if (resE.status === 401) {
        console.log("✅ TEST E PASSED: Unauthenticated enrollment rejected with 401");
    } else {
        throw new Error(`TEST E FAILED: Expected 401, got ${resE.status}`);
    }

    // TEST F: Authenticated enrollment succeeds
    const resF = await fetch(`${BASE_URL}/courses/${testCourseId}/enroll`, {
        method: "POST",
        headers: { Cookie: userA.cookie },
    });
    const dataF = await resF.json();
    if (resF.status === 200 && dataF.success && dataF.enrollment?.status === "active") {
        console.log("✅ TEST F PASSED: Authenticated enrollment succeeded (status active, progress 0%)");
    } else {
        throw new Error(`TEST F FAILED: status=${resF.status}, data=${JSON.stringify(dataF)}`);
    }

    // TEST G: Duplicate enrollment returns existing without duplicate row
    const resG = await fetch(`${BASE_URL}/courses/${testCourseId}/enroll`, {
        method: "POST",
        headers: { Cookie: userA.cookie },
    });
    const dataG = await resG.json();
    const countEnrollRes = await pool.query(
        "SELECT COUNT(*)::int AS count FROM course_enrollments WHERE user_id = $1 AND course_id = $2",
        [userA.id, testCourseId]
    );
    if (resG.status === 200 && countEnrollRes.rows[0].count === 1) {
        console.log("✅ TEST G PASSED: Duplicate enrollment is idempotent (exactly 1 row exists)");
    } else {
        throw new Error(`TEST G FAILED: Duplicate enrollment created multiple rows: count=${countEnrollRes.rows[0].count}`);
    }

    // Now User A is enrolled, verify they can access the non-preview lesson
    const resDEnrolled = await fetch(`${BASE_URL}/courses/${testSlug}/lessons/${nonPreviewLesson.slug}`, {
        headers: { Cookie: userA.cookie },
    });
    if (resDEnrolled.status === 200) {
        console.log("✅ TEST D.4 PASSED: Enrolled user can access non-preview lesson");
    } else {
        throw new Error(`TEST D.4 FAILED: Enrolled user failed to access non-preview lesson status=${resDEnrolled.status}`);
    }

    // TEST H: Lesson completion without enrollment returns 403
    const resH = await fetch(`${BASE_URL}/courses/lessons/${previewLesson.id}/complete`, {
        method: "POST",
        headers: { Cookie: userB.cookie }, // User B is not enrolled
    });
    if (resH.status === 403) {
        console.log("✅ TEST H PASSED: Lesson completion without enrollment rejected with 403");
    } else {
        throw new Error(`TEST H FAILED: Expected 403, got ${resH.status}`);
    }

    // Initial XP check for User A
    const initialProgressRes = await pool.query(
        "SELECT total_xp, courses_completed FROM student_progress WHERE user_id = $1",
        [userA.id]
    );
    const initialXp = initialProgressRes.rows[0]?.total_xp || 0;

    // TEST I: Enrolled lesson completion succeeds and awards +2 XP
    const resI = await fetch(`${BASE_URL}/courses/lessons/${previewLesson.id}/complete`, {
        method: "POST",
        headers: {
            Cookie: userA.cookie,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ xp: 9999, progressPercent: 100 }), // Client tamper attempt (TEST P & Q)
    });
    const dataI = await resI.json();

    const postLessonProgress = await pool.query(
        "SELECT total_xp FROM student_progress WHERE user_id = $1",
        [userA.id]
    );
    const xpAfterLesson = postLessonProgress.rows[0]?.total_xp || 0;

    if (resI.status === 200 && dataI.awardedXp === 2 && xpAfterLesson === initialXp + 2) {
        console.log(`✅ TEST I, P & Q PASSED: Lesson completion succeeded, awarded +2 XP, client tampering ignored (XP: ${initialXp} -> ${xpAfterLesson})`);
    } else {
        throw new Error(`TEST I FAILED: awardedXp=${dataI.awardedXp}, xpAfterLesson=${xpAfterLesson}, initialXp=${initialXp}`);
    }

    // TEST J: Repeated lesson completion awards no duplicate XP
    const resJ = await fetch(`${BASE_URL}/courses/lessons/${previewLesson.id}/complete`, {
        method: "POST",
        headers: { Cookie: userA.cookie },
    });
    const dataJ = await resJ.json();

    const postRepeatProgress = await pool.query(
        "SELECT total_xp FROM student_progress WHERE user_id = $1",
        [userA.id]
    );
    const xpAfterRepeat = postRepeatProgress.rows[0]?.total_xp || 0;

    if (resJ.status === 200 && dataJ.awardedXp === 0 && xpAfterRepeat === xpAfterLesson) {
        console.log("✅ TEST J PASSED: Repeated lesson completion awarded 0 duplicate XP");
    } else {
        throw new Error(`TEST J FAILED: duplicate XP awarded! xpAfterRepeat=${xpAfterRepeat}`);
    }

    // TEST K: Course progress returns accurate percentage
    const allCourseLessons = [];
    for (const sec of dataC.course.sections) {
        for (const les of sec.lessons) {
            allCourseLessons.push(les);
        }
    }
    const totalLessonsCount = allCourseLessons.length;
    const expectedProgress1 = Math.round((1 / totalLessonsCount) * 100);

    const resK = await fetch(`${BASE_URL}/courses/${testCourseId}/progress`, {
        headers: { Cookie: userA.cookie },
    });
    const dataK = await resK.json();

    if (resK.status === 200 && dataK.progressPercent === expectedProgress1 && dataK.completedLessons === 1) {
        console.log(`✅ TEST K PASSED: Course progress accurately computed (${expectedProgress1}% for 1/${totalLessonsCount} lessons)`);
    } else {
        throw new Error(`TEST K FAILED: progressPercent=${dataK.progressPercent}, expected=${expectedProgress1}`);
    }

    // TEST L, M, N: Complete all remaining lessons in this course
    // Remaining lessons: allCourseLessons.slice(1)
    let expectedFinalXp = xpAfterRepeat;
    for (let i = 1; i < allCourseLessons.length; i++) {
        const les = allCourseLessons[i];
        const resComplete = await fetch(`${BASE_URL}/courses/lessons/${les.id}/complete`, {
            method: "POST",
            headers: { Cookie: userA.cookie },
        });
        const dComplete = await resComplete.json();
        if (i === allCourseLessons.length - 1) {
            // Final lesson completes course: +2 XP for lesson + 25 XP for course
            expectedFinalXp += (2 + 25);
            if (!dComplete.courseNewlyCompleted || dComplete.courseStatus !== "completed") {
                throw new Error(`TEST L FAILED: Final lesson should complete course, got ${JSON.stringify(dComplete)}`);
            }
        } else {
            expectedFinalXp += 2;
        }
    }

    // Verify course status in enrollment
    const finalEnrollRes = await pool.query(
        "SELECT status, progress_percent, completed_at FROM course_enrollments WHERE user_id = $1 AND course_id = $2",
        [userA.id, testCourseId]
    );
    const finalEnroll = finalEnrollRes.rows[0];

    // Verify student_progress courses_completed and XP
    const finalStudentProgressRes = await pool.query(
        "SELECT total_xp, courses_completed FROM student_progress WHERE user_id = $1",
        [userA.id]
    );
    const finalStudentProgress = finalStudentProgressRes.rows[0];

    if (finalEnroll.status === "completed" && finalEnroll.progress_percent === 100 && finalEnroll.completed_at) {
        console.log("✅ TEST L PASSED: Course status transitioned to 'completed' with 100% progress and completed_at timestamp");
    } else {
        throw new Error(`TEST L FAILED: finalEnroll=${JSON.stringify(finalEnroll)}`);
    }

    if (finalStudentProgress.courses_completed === 1) {
        console.log("✅ TEST M PASSED: student_progress.courses_completed incremented to exactly 1");
    } else {
        throw new Error(`TEST M FAILED: courses_completed=${finalStudentProgress.courses_completed}`);
    }

    if (finalStudentProgress.total_xp === expectedFinalXp) {
        console.log(`✅ TEST N PASSED: Course completion awarded +25 XP bonus exactly once (Total XP: ${expectedFinalXp})`);
    } else {
        throw new Error(`TEST N FAILED: total_xp=${finalStudentProgress.total_xp}, expected=${expectedFinalXp}`);
    }

    // TEST O: Another user cannot see or modify User A's lesson progress
    const resOProgress = await fetch(`${BASE_URL}/courses/${testCourseId}/progress`, {
        headers: { Cookie: userB.cookie },
    });
    const dataOProgress = await resOProgress.json();
    if (resOProgress.status === 200 && dataOProgress.enrolled === false && dataOProgress.completedLessons === 0) {
        console.log("✅ TEST O PASSED: User B cannot see User A's course progress (isolated per user)");
    } else {
        throw new Error(`TEST O FAILED: User B saw progress=${JSON.stringify(dataOProgress)}`);
    }

    // TEST R: password_hash never exposed in course or enrollment responses
    const allResponsesStr = JSON.stringify([dataA, dataC, dataF, dataK, dataOProgress]);
    if (!allResponsesStr.includes("password_hash") && !allResponsesStr.includes("passwordHash")) {
        console.log("✅ TEST R PASSED: password_hash is never exposed in any course/enrollment response");
    } else {
        throw new Error("TEST R FAILED: password_hash found in API responses!");
    }

    console.log("\n==================================================");
    console.log("ALL STEP 10 COURSES & LEARNING PLATFORM TESTS PASSED!");
    console.log("==================================================\n");

    // Cleanup test data
    await pool.query("DELETE FROM courses WHERE slug = $1", [unpubSlug]);
    await pool.query("DELETE FROM users WHERE id IN ($1, $2)", [userA.id, userB.id]);
    console.log("🧹 Test artifacts safely cleaned up.");

    process.exit(0);
}

runTests().catch((err) => {
    console.error("❌ TEST RUNNER FAILED:", err);
    process.exit(1);
});
