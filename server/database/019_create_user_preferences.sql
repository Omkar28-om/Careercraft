-- CareerCraft Migration 019: Create User Preferences Table
-- STEP 14.5: Settings, Appearance & Notification Preferences

CREATE TABLE IF NOT EXISTS user_preferences (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL UNIQUE
                        REFERENCES users(id) ON DELETE CASCADE,
    theme           VARCHAR(20) NOT NULL DEFAULT 'dark'
                        CHECK (theme IN ('light', 'dark', 'system')),
    job_notifications       BOOLEAN NOT NULL DEFAULT TRUE,
    course_notifications    BOOLEAN NOT NULL DEFAULT TRUE,
    coding_notifications    BOOLEAN NOT NULL DEFAULT TRUE,
    freelance_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    system_notifications    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_preferences_user_id_idx ON user_preferences(user_id);

CREATE OR REPLACE FUNCTION set_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER trigger_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION set_user_preferences_updated_at();

INSERT INTO user_preferences (user_id)
SELECT id FROM users
ON CONFLICT (user_id) DO NOTHING;