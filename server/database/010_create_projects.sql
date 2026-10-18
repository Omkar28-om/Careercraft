-- Migration: 010_create_projects.sql
-- CareerCraft Student Projects & Portfolio Management

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL CHECK (char_length(trim(title)) > 0),
    slug VARCHAR(180),
    description TEXT,
    project_type VARCHAR(50) NOT NULL DEFAULT 'personal' CHECK (
        project_type IN ('academic', 'personal', 'hackathon', 'freelance', 'open_source', 'other')
    ),
    status VARCHAR(30) NOT NULL DEFAULT 'in_progress' CHECK (
        status IN ('planned', 'in_progress', 'completed')
    ),
    technologies JSONB NOT NULL DEFAULT '[]'::jsonb,
    github_url TEXT,
    live_url TEXT,
    image_url TEXT,
    start_date DATE,
    end_date DATE,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_public BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance and lookup
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_is_public ON projects(is_public);
CREATE INDEX IF NOT EXISTS idx_projects_is_featured ON projects(is_featured);
CREATE INDEX IF NOT EXISTS idx_projects_user_featured ON projects(user_id, is_featured);

-- Unique index on (user_id, slug) where slug is present
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_user_slug ON projects (user_id, slug) WHERE slug IS NOT NULL;

-- Trigger to maintain updated_at
CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_projects_updated_at ON projects;
CREATE TRIGGER trigger_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_projects_updated_at();
