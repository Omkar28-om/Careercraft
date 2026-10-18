CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

    bio TEXT,
    phone VARCHAR(20),
    location VARCHAR(100),
    college VARCHAR(150),
    degree VARCHAR(100),
    graduation_year INTEGER,
    avatar_url TEXT,
    github_url TEXT,
    linkedin_url TEXT,
    portfolio_url TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);