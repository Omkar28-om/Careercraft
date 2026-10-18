-- Migration: 015_create_freelancing.sql
-- CareerCraft Freelance Projects, Proposals, Contracts, and Saved Projects

-- 1. Freelance Projects Table
CREATE TABLE IF NOT EXISTS freelance_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(180) NOT NULL CHECK (char_length(trim(title)) > 0),
    description TEXT NOT NULL CHECK (char_length(trim(description)) > 0),
    category VARCHAR(100) NOT NULL,
    skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    budget_type VARCHAR(20) NOT NULL CHECK (budget_type IN ('fixed', 'hourly')),
    budget_min NUMERIC(12,2) CHECK (budget_min IS NULL OR budget_min >= 0),
    budget_max NUMERIC(12,2) CHECK (budget_max IS NULL OR budget_max >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    duration_days INTEGER CHECK (duration_days IS NULL OR duration_days > 0),
    experience_level VARCHAR(30) CHECK (experience_level IN ('beginner', 'intermediate', 'expert')),
    status VARCHAR(30) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_freelance_projects_client_id ON freelance_projects(client_id);
CREATE INDEX IF NOT EXISTS idx_freelance_projects_status ON freelance_projects(status);
CREATE INDEX IF NOT EXISTS idx_freelance_projects_category ON freelance_projects(category);
CREATE INDEX IF NOT EXISTS idx_freelance_projects_created_at ON freelance_projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_freelance_projects_budget_type ON freelance_projects(budget_type);

-- 2. Freelance Proposals Table
CREATE TABLE IF NOT EXISTS freelance_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES freelance_projects(id) ON DELETE CASCADE,
    freelancer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cover_letter TEXT NOT NULL CHECK (char_length(trim(cover_letter)) > 0),
    proposed_amount NUMERIC(12,2) NOT NULL CHECK (proposed_amount > 0),
    estimated_days INTEGER NOT NULL CHECK (estimated_days > 0),
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_freelance_proposals_project_freelancer UNIQUE (project_id, freelancer_id)
);

CREATE INDEX IF NOT EXISTS idx_freelance_proposals_project_id ON freelance_proposals(project_id);
CREATE INDEX IF NOT EXISTS idx_freelance_proposals_freelancer_id ON freelance_proposals(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_freelance_proposals_status ON freelance_proposals(status);
CREATE INDEX IF NOT EXISTS idx_freelance_proposals_created_at ON freelance_proposals(created_at DESC);

-- 3. Freelance Contracts Table
CREATE TABLE IF NOT EXISTS freelance_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES freelance_projects(id) ON DELETE CASCADE,
    proposal_id UUID NOT NULL UNIQUE REFERENCES freelance_proposals(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    freelancer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agreed_amount NUMERIC(12,2) NOT NULL CHECK (agreed_amount > 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_freelance_contracts_project_id ON freelance_contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_freelance_contracts_client_id ON freelance_contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_freelance_contracts_freelancer_id ON freelance_contracts(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_freelance_contracts_status ON freelance_contracts(status);

-- 4. Freelance Saved Projects Table
CREATE TABLE IF NOT EXISTS freelance_saved_projects (
    freelancer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES freelance_projects(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (freelancer_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_freelance_saved_projects_freelancer_id ON freelance_saved_projects(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_freelance_saved_projects_project_id ON freelance_saved_projects(project_id);

-- 5. Updated At Trigger Function & Triggers
CREATE OR REPLACE FUNCTION update_freelance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_freelance_projects_updated_at ON freelance_projects;
CREATE TRIGGER trigger_freelance_projects_updated_at
BEFORE UPDATE ON freelance_projects
FOR EACH ROW
EXECUTE FUNCTION update_freelance_updated_at();

DROP TRIGGER IF EXISTS trigger_freelance_proposals_updated_at ON freelance_proposals;
CREATE TRIGGER trigger_freelance_proposals_updated_at
BEFORE UPDATE ON freelance_proposals
FOR EACH ROW
EXECUTE FUNCTION update_freelance_updated_at();

DROP TRIGGER IF EXISTS trigger_freelance_contracts_updated_at ON freelance_contracts;
CREATE TRIGGER trigger_freelance_contracts_updated_at
BEFORE UPDATE ON freelance_contracts
FOR EACH ROW
EXECUTE FUNCTION update_freelance_updated_at();
