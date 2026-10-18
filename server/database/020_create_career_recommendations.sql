-- CareerCraft Migration 020: Career Recommendation Architecture
-- STEP 19: Complete AI Career Recommendation System

-- 1. Career Paths Catalog
CREATE TABLE IF NOT EXISTS career_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(120) UNIQUE NOT NULL,
    name VARCHAR(180) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    level VARCHAR(50) DEFAULT 'all_levels',
    icon VARCHAR(80) DEFAULT 'Compass',
    required_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    recommended_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    related_courses JSONB NOT NULL DEFAULT '[]'::jsonb,
    related_projects JSONB NOT NULL DEFAULT '[]'::jsonb,
    related_coding_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_career_paths_slug ON career_paths(slug);
CREATE INDEX IF NOT EXISTS idx_career_paths_is_active ON career_paths(is_active);
CREATE INDEX IF NOT EXISTS idx_career_paths_category ON career_paths(category);

-- Trigger for career_paths updated_at
CREATE OR REPLACE FUNCTION update_career_paths_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_career_paths_updated_at ON career_paths;
CREATE TRIGGER trigger_career_paths_updated_at
    BEFORE UPDATE ON career_paths
    FOR EACH ROW
    EXECUTE FUNCTION update_career_paths_updated_at();

-- 2. Career Preferences
CREATE TABLE IF NOT EXISTS career_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    target_roles JSONB NOT NULL DEFAULT '[]'::jsonb,
    preferred_domains JSONB NOT NULL DEFAULT '[]'::jsonb,
    preferred_work_mode VARCHAR(30) DEFAULT 'flexible' CHECK (preferred_work_mode IN ('remote', 'hybrid', 'onsite', 'flexible')),
    experience_goal VARCHAR(50) DEFAULT 'entry_level' CHECK (experience_goal IN ('internship', 'entry_level', 'mid_level', 'freelance', 'transition')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_career_preferences_user_id ON career_preferences(user_id);

-- Trigger for career_preferences updated_at
CREATE OR REPLACE FUNCTION update_career_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_career_preferences_updated_at ON career_preferences;
CREATE TRIGGER trigger_career_preferences_updated_at
    BEFORE UPDATE ON career_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_career_preferences_updated_at();

-- 3. Career Recommendation Snapshots
CREATE TABLE IF NOT EXISTS career_recommendation_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    engine_version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    career_readiness NUMERIC(5,2) NOT NULL DEFAULT 0,
    top_recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
    skill_gaps JSONB NOT NULL DEFAULT '{}'::jsonb,
    next_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
    data_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_career_snapshots_user_id ON career_recommendation_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_career_snapshots_generated_at ON career_recommendation_snapshots(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_career_snapshots_user_generated ON career_recommendation_snapshots(user_id, generated_at DESC);

-- Seed Initial 13 Career Paths
INSERT INTO career_paths (
    slug, name, description, category, level, icon,
    required_skills, recommended_skills, related_courses,
    related_projects, related_coding_categories, is_active
)
VALUES
(
    'frontend-developer',
    'Frontend Developer',
    'Specializes in building intuitive, responsive, and high-performance client-side web interfaces with modern frameworks and accessible design systems.',
    'Frontend',
    'all_levels',
    'Layout',
    '["JavaScript", "React", "HTML", "CSS", "TypeScript", "Tailwind CSS", "Git"]'::jsonb,
    '["Next.js", "Redux", "Webpack", "REST APIs", "Jest"]'::jsonb,
    '["Frontend", "Web Development", "JavaScript"]'::jsonb,
    '[
        {"title": "Component Design System", "stack": ["React", "TypeScript", "Storybook", "Tailwind CSS"], "description": "Accessible, reusable design system component library."},
        {"title": "E-Commerce Client Interface", "stack": ["React", "Next.js", "Zustand"], "description": "Responsive storefront with fluid cart, search, and checkout interactions."}
    ]'::jsonb,
    '["JavaScript", "Web", "Strings", "Arrays"]'::jsonb,
    true
),
(
    'backend-developer',
    'Backend Developer',
    'Architects robust server architectures, scalable relational databases, microservices, and secure API gateways with bulletproof reliability.',
    'Backend',
    'all_levels',
    'Server',
    '["Node.js", "Express", "PostgreSQL", "SQL", "REST APIs", "Git"]'::jsonb,
    '["Docker", "Redis", "Python", "Java", "Microservices", "MongoDB"]'::jsonb,
    '["Backend", "Database", "Programming", "API"]'::jsonb,
    '[
        {"title": "High-Throughput API Gateway", "stack": ["Node.js", "Express", "PostgreSQL", "Redis"], "description": "Rate-limited, cached REST and GraphQL backend services."},
        {"title": "Distributed Task Queue Worker", "stack": ["Node.js", "Redis", "PostgreSQL", "Docker"], "description": "Asynchronous job scheduler with retry policies and dead-letter queues."}
    ]'::jsonb,
    '["Algorithms", "Data Structures", "SQL", "Databases"]'::jsonb,
    true
),
(
    'full-stack-developer',
    'Full Stack Developer',
    'Bridges client-side interactivity and server-side engineering to deliver end-to-end web products from database schema to styled UI components.',
    'Full Stack',
    'all_levels',
    'Layers',
    '["JavaScript", "React", "Node.js", "PostgreSQL", "REST APIs", "Git", "HTML", "CSS"]'::jsonb,
    '["TypeScript", "Docker", "Tailwind CSS", "Redis", "Next.js"]'::jsonb,
    '["Full Stack", "Web Development", "Database", "Frontend", "Backend"]'::jsonb,
    '[
        {"title": "Collaborative SaaS Workspace", "stack": ["React", "Node.js", "PostgreSQL", "Socket.io"], "description": "Multi-tenant workspace with real-time editing and permission management."},
        {"title": "Cloud Content Management System", "stack": ["Next.js", "Node.js", "PostgreSQL", "Tailwind CSS"], "description": "Markdown blogging and content publishing portal with live analytics."}
    ]'::jsonb,
    '["Algorithms", "JavaScript", "Web", "SQL"]'::jsonb,
    true
),
(
    'software-engineer',
    'Software Engineer',
    'Solves complex computational problems through structured algorithms, system design principles, object-oriented design, and clean architecture.',
    'Engineering',
    'all_levels',
    'Cpu',
    '["Data Structures", "Algorithms", "Java", "Python", "Git", "SQL", "Object-Oriented Programming"]'::jsonb,
    '["C++", "System Design", "Docker", "Linux", "CI/CD"]'::jsonb,
    '["Programming", "Computer Science", "Algorithms"]'::jsonb,
    '[
        {"title": "In-Memory Key-Value Store", "stack": ["Java", "Multithreading", "Networking"], "description": "Concurrent cache store implementing LRU eviction and replication."},
        {"title": "Graph Traversal & Routing Engine", "stack": ["Python", "Algorithms", "Data Structures"], "description": "Shortest-path graph solver for dynamic transportation networks."}
    ]'::jsonb,
    '["Algorithms", "Data Structures", "Arrays", "Dynamic Programming", "Trees", "Graphs"]'::jsonb,
    true
),
(
    'data-analyst',
    'Data Analyst',
    'Transforms raw business data into actionable visual insights, interactive business intelligence dashboards, and predictive trend reports.',
    'Data',
    'all_levels',
    'BarChart3',
    '["SQL", "Python", "Excel", "Data Analysis", "Tableau", "Statistics"]'::jsonb,
    '["Power BI", "Pandas", "NumPy", "Data Visualization", "R"]'::jsonb,
    '["Data", "Database", "Analytics"]'::jsonb,
    '[
        {"title": "Customer Retention Cohort Dashboard", "stack": ["SQL", "Tableau", "Python"], "description": "Interactive cohort analysis quantifying churn drivers and customer lifetime value."},
        {"title": "Financial KPI Analytics Suite", "stack": ["Python", "Pandas", "Power BI"], "description": "Automated reporting pipeline synthesizing multi-source revenue streams."}
    ]'::jsonb,
    '["SQL", "Databases", "Math"]'::jsonb,
    true
),
(
    'data-scientist',
    'Data Scientist',
    'Formulates statistical hypotheses, engineers predictive features, and extracts deep mathematical insights from large-scale structured and unstructured data.',
    'Data',
    'all_levels',
    'LineChart',
    '["Python", "Machine Learning", "SQL", "Statistics", "Pandas", "NumPy", "Data Analysis"]'::jsonb,
    '["Scikit-Learn", "Data Visualization", "R", "Deep Learning", "Mathematics"]'::jsonb,
    '["Data", "AI & ML", "Machine Learning"]'::jsonb,
    '[
        {"title": "Customer Churn Prediction Model", "stack": ["Python", "Scikit-Learn", "Pandas", "SQL"], "description": "End-to-end classifier with ROC-AUC optimization and SHAP explainability."},
        {"title": "Time-Series Demand Forecasting", "stack": ["Python", "Statsmodels", "NumPy", "Prophet"], "description": "Multi-season forecasting model predicting inventory consumption."}
    ]'::jsonb,
    '["Math", "Algorithms", "SQL"]'::jsonb,
    true
),
(
    'machine-learning-engineer',
    'Machine Learning Engineer',
    'Designs, trains, deploys, and monitors scalable machine learning models and deep neural networks in production environments.',
    'AI & ML',
    'all_levels',
    'Brain',
    '["Python", "Machine Learning", "PyTorch", "TensorFlow", "Algorithms", "Mathematics", "Git"]'::jsonb,
    '["Scikit-Learn", "Docker", "FastAPI", "MLOps", "Deep Learning", "Pandas"]'::jsonb,
    '["AI & ML", "Machine Learning", "Python"]'::jsonb,
    '[
        {"title": "Image Classification & Inference API", "stack": ["PyTorch", "FastAPI", "Docker", "Python"], "description": "Convolutional vision pipeline served over GPU-accelerated endpoints."},
        {"title": "Automated MLOps Training Pipeline", "stack": ["Python", "MLflow", "Docker", "DVC"], "description": "Continuous training and artifact tracking pipeline for drift detection."}
    ]'::jsonb,
    '["Algorithms", "Math", "Data Structures"]'::jsonb,
    true
),
(
    'ai-engineer',
    'AI Engineer',
    'Leverages modern foundational models, RAG pipelines, fine-tuning, and semantic vector stores to embed intelligent agentic capabilities into software products.',
    'AI & ML',
    'all_levels',
    'Sparkles',
    '["Python", "FastAPI", "Machine Learning", "LLMs", "Vector Databases", "REST APIs", "Git"]'::jsonb,
    '["LangChain", "PyTorch", "Prompt Engineering", "Docker", "Embeddings", "NLP"]'::jsonb,
    '["AI & ML", "Python", "Cloud"]'::jsonb,
    '[
        {"title": "Enterprise Semantic Document Search", "stack": ["Python", "FastAPI", "Vector DB", "Embeddings"], "description": "Retrieval-augmented generation engine querying complex PDF knowledge bases."},
        {"title": "Autonomous Task Orchestration Agent", "stack": ["Python", "LangChain", "FastAPI", "PostgreSQL"], "description": "Multi-step tool-calling agent executing natural language operations."}
    ]'::jsonb,
    '["Algorithms", "Web", "Math"]'::jsonb,
    true
),
(
    'devops-cloud-engineer',
    'DevOps / Cloud Engineer',
    'Automates continuous integration and delivery pipelines, provisions immutable cloud infrastructure as code, and maintains resilient production clusters.',
    'Cloud & Infrastructure',
    'all_levels',
    'Cloud',
    '["Linux", "Docker", "Kubernetes", "AWS", "CI/CD", "Git", "Bash"]'::jsonb,
    '["Terraform", "Ansible", "Cloud", "Monitoring", "Python", "Networking"]'::jsonb,
    '["Cloud", "DevOps", "Systems"]'::jsonb,
    '[
        {"title": "Production Kubernetes Cluster via IaC", "stack": ["Terraform", "Kubernetes", "AWS", "Helm"], "description": "Declarative multi-zone cluster deployment with ingress and auto-scaling."},
        {"title": "Zero-Downtime CI/CD Delivery Pipeline", "stack": ["GitHub Actions", "Docker", "Bash", "AWS"], "description": "Automated container security scanning, linting, and blue-green deploy."}
    ]'::jsonb,
    '["System Design", "Linux", "Scripting"]'::jsonb,
    true
),
(
    'cybersecurity-analyst',
    'Cybersecurity Analyst',
    'Safeguards infrastructure, identifies attack surfaces, conducts vulnerability assessments, and implements defense-in-depth security policies.',
    'Security',
    'all_levels',
    'ShieldCheck',
    '["Networking", "Linux", "Security", "Python", "Cryptography", "Vulnerability Assessment"]'::jsonb,
    '["Wireshark", "Penetration Testing", "SIEM", "Firewalls", "Bash", "Incident Response"]'::jsonb,
    '["Security", "Networking", "Systems"]'::jsonb,
    '[
        {"title": "Automated Network Vulnerability Scanner", "stack": ["Python", "Networking", "Linux", "Security"], "description": "Port scanning and service enumeration tool with CVE vulnerability mapping."},
        {"title": "SIEM Log Ingestion & Threat Detection", "stack": ["Python", "Linux", "SIEM", "Regex"], "description": "Real-time anomaly detector analyzing authentication logs for intrusion attempts."}
    ]'::jsonb,
    '["Security", "Algorithms", "Strings"]'::jsonb,
    true
),
(
    'mobile-developer',
    'Mobile Developer',
    'Engineers fluid, touch-optimized iOS and Android native or cross-platform mobile experiences with offline caching and native hardware APIs.',
    'Mobile',
    'all_levels',
    'Smartphone',
    '["React Native", "JavaScript", "TypeScript", "Mobile App Development", "Git", "REST APIs"]'::jsonb,
    '["Flutter", "Kotlin", "Swift", "iOS", "Android", "State Management"]'::jsonb,
    '["Mobile", "Frontend", "JavaScript"]'::jsonb,
    '[
        {"title": "Offline-First Mobile Task Tracker", "stack": ["React Native", "TypeScript", "SQLite"], "description": "Cross-platform mobile app with background synchronization and push notifications."},
        {"title": "Fitness & Geo-Tracking Mobile App", "stack": ["React Native", "REST APIs", "Map APIs"], "description": "Interactive workout tracking app with real-time location telemetry."}
    ]'::jsonb,
    '["Algorithms", "JavaScript", "Data Structures"]'::jsonb,
    true
),
(
    'qa-automation-engineer',
    'QA / Automation Engineer',
    'Constructs resilient test automation frameworks, end-to-end regression suites, and performance load tests ensuring flawless software quality.',
    'Quality Engineering',
    'all_levels',
    'CheckCheck',
    '["Test Automation", "Selenium", "JavaScript", "Python", "Manual Testing", "Git", "API Testing"]'::jsonb,
    '["Cypress", "Jest", "Postman", "CI/CD", "JMeter", "SQL"]'::jsonb,
    '["Testing", "Programming", "Web Development"]'::jsonb,
    '[
        {"title": "Cross-Browser E2E Automation Framework", "stack": ["Cypress", "JavaScript", "CI/CD"], "description": "Headless regression test suite validating critical user checkout funnels."},
        {"title": "REST API Automated Contract Testing", "stack": ["Postman", "JavaScript", "Jest", "GitHub Actions"], "description": "Automated regression pipeline validating OpenAPI schema conformance."}
    ]'::jsonb,
    '["Testing", "Algorithms", "Web"]'::jsonb,
    true
),
(
    'ui-ux-product-designer',
    'UI/UX / Product Designer',
    'Crafts user-centric digital experiences, conduct research interviews, builds high-fidelity interactive prototypes, and orchestrates coherent design systems.',
    'Design',
    'all_levels',
    'Palette',
    '["Figma", "UI Design", "UX Research", "Wireframing", "Prototyping", "Design Systems"]'::jsonb,
    '["HTML", "CSS", "User Testing", "Adobe XD", "Accessibility", "Interaction Design"]'::jsonb,
    '["Design", "Frontend", "UI/UX"]'::jsonb,
    '[
        {"title": "Fintech Mobile Design System", "stack": ["Figma", "Design Systems", "Prototyping"], "description": "Comprehensive tokenized UI system with dark mode variants and accessibility specs."},
        {"title": "SaaS Onboarding UX Research & Wireframes", "stack": ["Figma", "UX Research", "Wireframing"], "description": "User journey mapping and usability-tested wireframes reducing activation friction."}
    ]'::jsonb,
    '["Frontend", "Design"]'::jsonb,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    level = EXCLUDED.level,
    icon = EXCLUDED.icon,
    required_skills = EXCLUDED.required_skills,
    recommended_skills = EXCLUDED.recommended_skills,
    related_courses = EXCLUDED.related_courses,
    related_projects = EXCLUDED.related_projects,
    related_coding_categories = EXCLUDED.related_coding_categories,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();
