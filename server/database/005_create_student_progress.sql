-- Migration: create student_progress table for real dashboard statistics
CREATE TABLE IF NOT EXISTS student_progress (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_xp INTEGER NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
    current_streak INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
    longest_streak INTEGER NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
    problems_solved INTEGER NOT NULL DEFAULT 0 CHECK (problems_solved >= 0),
    courses_completed INTEGER NOT NULL DEFAULT 0 CHECK (courses_completed >= 0),
    projects_completed INTEGER NOT NULL DEFAULT 0 CHECK (projects_completed >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
