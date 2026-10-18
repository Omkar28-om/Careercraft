-- Migration 007: Create achievements and user_achievements tables

CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(50),
    requirement_type VARCHAR(50) NOT NULL,
    requirement_value INTEGER,
    reward_xp INTEGER NOT NULL DEFAULT 0 CHECK (reward_xp >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_achievements (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_code ON achievements(code);

-- Seed initial achievements (idempotent ON CONFLICT)
INSERT INTO achievements (code, title, description, icon, requirement_type, requirement_value, reward_xp)
VALUES
    ('FIRST_STEP', 'First Step', 'Added your first technical skill to your profile.', 'Sparkles', 'skill_count', 1, 10),
    ('SKILL_BUILDER', 'Skill Builder', 'Added 5 skills to your profile.', 'Award', 'skill_count', 5, 25),
    ('PROFILE_COMPLETE', 'Profile Completed', 'Completed your bio, college, and degree on your profile.', 'CheckCircle2', 'profile_complete', 1, 25),
    ('XP_BEGINNER', 'XP Beginner', 'Reached 100 total XP on CareerCraft.', 'Trophy', 'total_xp', 100, 25),
    ('XP_RISING', 'XP Rising Star', 'Reached 250 total XP on CareerCraft.', 'Flame', 'total_xp', 250, 50)
ON CONFLICT (code) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    requirement_type = EXCLUDED.requirement_type,
    requirement_value = EXCLUDED.requirement_value,
    reward_xp = EXCLUDED.reward_xp;
