-- Migration: 011_create_courses.sql
-- CareerCraft Courses & Learning Platform Schema

-- 1. Courses Table
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(180) NOT NULL CHECK (char_length(trim(title)) > 0),
    slug VARCHAR(200) NOT NULL UNIQUE,
    description TEXT,
    short_description VARCHAR(300),
    thumbnail_url TEXT,
    category VARCHAR(100),
    level VARCHAR(30) CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    instructor_name VARCHAR(150),
    duration_minutes INTEGER,
    is_published BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courses_is_published ON courses(is_published);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_level ON courses(level);

-- 2. Course Sections Table
CREATE TABLE IF NOT EXISTS course_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(180) NOT NULL CHECK (char_length(trim(title)) > 0),
    description TEXT,
    section_order INTEGER NOT NULL CHECK (section_order >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_course_sections_order UNIQUE (course_id, section_order)
);

CREATE INDEX IF NOT EXISTS idx_course_sections_course_id ON course_sections(course_id);

-- 3. Course Lessons Table
CREATE TABLE IF NOT EXISTS course_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL REFERENCES course_sections(id) ON DELETE CASCADE,
    title VARCHAR(180) NOT NULL CHECK (char_length(trim(title)) > 0),
    slug VARCHAR(200),
    lesson_order INTEGER NOT NULL CHECK (lesson_order >= 0),
    content TEXT,
    video_url TEXT,
    duration_minutes INTEGER,
    lesson_type VARCHAR(30) CHECK (lesson_type IN ('article', 'video', 'quiz')),
    is_preview BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_course_lessons_order UNIQUE (section_id, lesson_order)
);

CREATE INDEX IF NOT EXISTS idx_course_lessons_section_id ON course_lessons(section_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_slug ON course_lessons(slug);

-- 4. Course Enrollments Table
CREATE TABLE IF NOT EXISTS course_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
    status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_course_enrollments_user_course UNIQUE (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_course_enrollments_user_id ON course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_user_status ON course_enrollments(user_id, status);

-- 5. Course Lesson Progress Table
CREATE TABLE IF NOT EXISTS course_lesson_progress (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
    completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    last_accessed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_course_lesson_progress_user_id ON course_lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_course_lesson_progress_lesson_id ON course_lesson_progress(lesson_id);

-- 6. Trigger Function to update updated_at
CREATE OR REPLACE FUNCTION update_courses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply Triggers
DROP TRIGGER IF EXISTS trigger_courses_updated_at ON courses;
CREATE TRIGGER trigger_courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW
    EXECUTE FUNCTION update_courses_updated_at();

DROP TRIGGER IF EXISTS trigger_course_sections_updated_at ON course_sections;
CREATE TRIGGER trigger_course_sections_updated_at
    BEFORE UPDATE ON course_sections
    FOR EACH ROW
    EXECUTE FUNCTION update_courses_updated_at();

DROP TRIGGER IF EXISTS trigger_course_lessons_updated_at ON course_lessons;
CREATE TRIGGER trigger_course_lessons_updated_at
    BEFORE UPDATE ON course_lessons
    FOR EACH ROW
    EXECUTE FUNCTION update_courses_updated_at();

DROP TRIGGER IF EXISTS trigger_course_enrollments_updated_at ON course_enrollments;
CREATE TRIGGER trigger_course_enrollments_updated_at
    BEFORE UPDATE ON course_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION update_courses_updated_at();

DROP TRIGGER IF EXISTS trigger_course_lesson_progress_updated_at ON course_lesson_progress;
CREATE TRIGGER trigger_course_lesson_progress_updated_at
    BEFORE UPDATE ON course_lesson_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_courses_updated_at();
