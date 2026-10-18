-- Migration 008: Coding Platform Database Foundation
-- Creates coding_problems, coding_test_cases, coding_submissions, and coding_problem_progress

-- 1. Coding Problems Table
CREATE TABLE IF NOT EXISTS coding_problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(150) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    category VARCHAR(100),
    tags JSONB DEFAULT '[]'::jsonb,
    constraints TEXT,
    input_format TEXT,
    output_format TEXT,
    examples JSONB DEFAULT '[]'::jsonb,
    starter_code JSONB DEFAULT '{}'::jsonb,
    solution_explanation TEXT,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coding_problems_slug ON coding_problems(slug);
CREATE INDEX IF NOT EXISTS idx_coding_problems_difficulty ON coding_problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_coding_problems_category ON coding_problems(category);
CREATE INDEX IF NOT EXISTS idx_coding_problems_published ON coding_problems(is_published);

-- 2. Coding Test Cases Table
CREATE TABLE IF NOT EXISTS coding_test_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL REFERENCES coding_problems(id) ON DELETE CASCADE,
    input_data TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    is_sample BOOLEAN NOT NULL DEFAULT false,
    is_hidden BOOLEAN NOT NULL DEFAULT true,
    test_order INTEGER NOT NULL DEFAULT 0 CHECK (test_order >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coding_test_cases_problem_id ON coding_test_cases(problem_id);
CREATE INDEX IF NOT EXISTS idx_coding_test_cases_sample ON coding_test_cases(problem_id, is_sample);

-- 3. Coding Submissions Table
CREATE TABLE IF NOT EXISTS coding_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES coding_problems(id) ON DELETE CASCADE,
    language VARCHAR(30) NOT NULL,
    source_code TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (
        status IN (
            'pending',
            'running',
            'accepted',
            'wrong_answer',
            'runtime_error',
            'compilation_error',
            'time_limit',
            'memory_limit',
            'internal_error'
        )
    ),
    execution_time_ms INTEGER,
    memory_kb INTEGER,
    test_cases_passed INTEGER NOT NULL DEFAULT 0,
    test_cases_total INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    judge_submission_id VARCHAR(150),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coding_submissions_user_id ON coding_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_coding_submissions_problem_id ON coding_submissions(problem_id);
CREATE INDEX IF NOT EXISTS idx_coding_submissions_submitted_at ON coding_submissions(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_coding_submissions_user_problem ON coding_submissions(user_id, problem_id);

-- 4. User Problem Progress Table
CREATE TABLE IF NOT EXISTS coding_problem_progress (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES coding_problems(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'attempted' CHECK (status IN ('attempted', 'solved')),
    best_submission_id UUID REFERENCES coding_submissions(id) ON DELETE SET NULL,
    attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    solved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, problem_id)
);

CREATE INDEX IF NOT EXISTS idx_coding_problem_progress_user ON coding_problem_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_coding_problem_progress_status ON coding_problem_progress(user_id, status);
