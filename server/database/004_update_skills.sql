-- Migration: add user_id, proficiency, updated_at and composite unique constraint to skills table
ALTER TABLE skills DROP CONSTRAINT IF EXISTS skills_name_key;

ALTER TABLE skills ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE skills ADD COLUMN IF NOT EXISTS proficiency VARCHAR(50) NOT NULL DEFAULT 'Beginner';

ALTER TABLE skills ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_skill'
    ) THEN
        ALTER TABLE skills ADD CONSTRAINT unique_user_skill UNIQUE (user_id, name);
    END IF;
END $$;
