-- Migration 023: Add career_domain to profiles table
-- Supports personalized student career domains (Full Stack, AI/ML, Data Science, etc.)

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS career_domain VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_profiles_career_domain ON profiles(career_domain);

-- Automatically create profiles entry for any existing users without a profile
INSERT INTO profiles (id)
SELECT id FROM users
ON CONFLICT (id) DO NOTHING;
