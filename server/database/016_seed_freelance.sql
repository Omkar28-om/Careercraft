-- Migration: 016_seed_freelance.sql
-- Seed initial demo freelance projects for CareerCraft marketplace

DO $$
DECLARE
    v_client_id UUID;
BEGIN
    SELECT id INTO v_client_id FROM users ORDER BY created_at ASC LIMIT 1;

    IF v_client_id IS NOT NULL THEN
        -- Only insert if not already present
        IF NOT EXISTS (SELECT 1 FROM freelance_projects WHERE title = 'Build Responsive SaaS Analytics Dashboard in Next.js') THEN
            INSERT INTO freelance_projects (
                client_id, title, description, category, skills,
                budget_type, budget_min, budget_max, currency, duration_days, experience_level, status
            ) VALUES
            (
                v_client_id,
                'Build Responsive SaaS Analytics Dashboard in Next.js',
                'We need a talented student or freelance frontend engineer to convert our Figma wireframes into a fully responsive dark-mode dashboard with interactive charts and exportable reports.',
                'Frontend',
                '["React", "Next.js", "Tailwind CSS", "Recharts", "TypeScript"]'::jsonb,
                'fixed',
                25000.00,
                45000.00,
                'INR',
                14,
                'intermediate',
                'open'
            ),
            (
                v_client_id,
                'Develop FastAPI Microservice with OpenAI & Vector DB',
                'Looking for an AI engineer to construct a semantic document search pipeline that accepts PDF uploads, chunks content into embeddings, and serves fast queries with citation metadata.',
                'AI & Automation',
                '["Python", "FastAPI", "Pinecone", "OpenAI API", "Docker"]'::jsonb,
                'fixed',
                35000.00,
                60000.00,
                'INR',
                21,
                'expert',
                'open'
            ),
            (
                v_client_id,
                'React Native Mobile App UI Bug Fixes & Optimization',
                'Polish existing workout tracking screens, fix keyboard-avoiding visual bugs on iOS, and improve list scrolling performance on Android low-tier devices.',
                'Mobile App',
                '["React Native", "Expo", "Redux Toolkit", "iOS", "Android"]'::jsonb,
                'hourly',
                800.00,
                1500.00,
                'INR',
                10,
                'intermediate',
                'open'
            ),
            (
                v_client_id,
                'Custom PostgreSQL Analytics & Report Automation Service',
                'Design optimized PostgreSQL SQL views, indexing strategies, and automated daily export workers that generate summarized business KPI reports.',
                'Full Stack',
                '["Node.js", "Express", "PostgreSQL", "Cron", "Redis"]'::jsonb,
                'fixed',
                20000.00,
                30000.00,
                'INR',
                7,
                'intermediate',
                'open'
            ),
            (
                v_client_id,
                'High-Performance REST & WebSocket Backend for Realtime Collaboration',
                'Construct lightweight, low-latency room synchronization services supporting 50+ concurrent users per room with message broadcast and room state recovery.',
                'Backend API',
                '["Go", "WebSockets", "Redis", "Docker", "REST API"]'::jsonb,
                'hourly',
                1200.00,
                2000.00,
                'INR',
                30,
                'expert',
                'open'
            ),
            (
                v_client_id,
                'Portfolio Landing Page with 3D Canvas Micro-Interactions',
                'Create an eye-catching portfolio showcase website for an indie design agency featuring smooth Three.js / Canvas micro-interactions and mobile responsiveness.',
                'Frontend',
                '["HTML5", "CSS3", "JavaScript", "Three.js", "Tailwind CSS"]'::jsonb,
                'fixed',
                12000.00,
                18000.00,
                'INR',
                5,
                'beginner',
                'open'
            );
        END IF;
    END IF;
END $$;
