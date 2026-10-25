-- Add missing course banners and student-friendly demo resources.
UPDATE courses
SET thumbnail_url = CASE
    WHEN category ILIKE '%health%' OR category ILIKE '%life science%' THEN 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&auto=format&fit=crop&q=85'
    WHEN category ILIKE '%data%' OR category ILIKE '%analytics%' THEN 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=85'
    WHEN category ILIKE '%cloud%' OR category ILIKE '%cyber%' THEN 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&auto=format&fit=crop&q=85'
    WHEN category ILIKE '%market%' OR category ILIKE '%content%' THEN 'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=1200&auto=format&fit=crop&q=85'
    WHEN category ILIKE '%finance%' THEN 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=85'
    WHEN category ILIKE '%business%' OR category ILIKE '%management%' THEN 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&auto=format&fit=crop&q=85'
    ELSE 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&auto=format&fit=crop&q=85'
END
WHERE thumbnail_url IS NULL OR trim(thumbnail_url) = '';

INSERT INTO coding_problems (
    slug, title, description, difficulty, category, tags, constraints,
    input_format, output_format, examples, starter_code, solution_explanation, is_published
)
VALUES
('sum-student-scores', 'Sum Student Scores', 'Given the number of quiz scores and the scores themselves, calculate the total. Practice reading input and looping over a list.', 'Easy', 'Array', '["Array", "Basic Math", "Beginner"]'::jsonb, '1 ≤ n ≤ 1000; 0 ≤ score ≤ 100.', 'First line: n. Second line: n integer scores.', 'Print the sum of all scores.', '[{"input":"n = 4; scores = 10 20 30 40","output":"100"}]'::jsonb,
 jsonb_build_object('javascript', $js$let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", chunk => input += chunk);
process.stdin.on("end", () => {
  const values = input.trim().split(/\s+/).map(Number);
  console.log(values.slice(1, values[0] + 1).reduce((sum, value) => sum + value, 0));
});$js$, 'python', $py$import sys
values = list(map(int, sys.stdin.read().split()))
print(sum(values[1:values[0] + 1]))$py$),
 'Read n and add exactly the next n values. Time complexity is O(n).', true),
('count-vowels', 'Count the Vowels', 'Given a single word, count its vowels. Treat uppercase and lowercase vowels the same.', 'Easy', 'String', '["String", "Counting", "Beginner"]'::jsonb, 'Input is one non-empty word of at most 1000 English letters.', 'One line containing a word.', 'Print the number of a, e, i, o, and u characters.', '[{"input":"CareerCraft","output":"4"}]'::jsonb,
 jsonb_build_object('javascript', $js$let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", chunk => input += chunk);
process.stdin.on("end", () => console.log([...input.trim().toLowerCase()].filter(c => "aeiou".includes(c)).length));$js$, 'python', $py$word = input().strip().lower()
print(sum(1 for letter in word if letter in "aeiou"))$py$),
 'Normalize the word to lowercase and count characters in the vowel set. Time complexity is O(n).', true),
('highest-quiz-score', 'Highest Quiz Score', 'Given a class size and each student''s quiz score, find the highest score. Assume at least one student.', 'Easy', 'Array', '["Array", "Loops", "Beginner"]'::jsonb, '1 ≤ n ≤ 1000; 0 ≤ score ≤ 100.', 'First line: n. Second line: n integer scores.', 'Print the largest score.', '[{"input":"n = 5; scores = 62 91 77 84 90","output":"91"}]'::jsonb,
 jsonb_build_object('javascript', $js$let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", chunk => input += chunk);
process.stdin.on("end", () => {
  const values = input.trim().split(/\s+/).map(Number);
  console.log(Math.max(...values.slice(1, values[0] + 1)));
});$js$, 'python', $py$import sys
values = list(map(int, sys.stdin.read().split()))
n = values[0]
scores = values[1:]
print(max(scores[:n]))$py$),
 'Compare each score and keep the greatest value seen. Time complexity is O(n).', true)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title, description = EXCLUDED.description, difficulty = EXCLUDED.difficulty,
    category = EXCLUDED.category, tags = EXCLUDED.tags, constraints = EXCLUDED.constraints,
    input_format = EXCLUDED.input_format, output_format = EXCLUDED.output_format,
    examples = EXCLUDED.examples, starter_code = EXCLUDED.starter_code,
    solution_explanation = EXCLUDED.solution_explanation, is_published = true;

WITH new_cases(slug, input_data, expected_output, is_sample, is_hidden, test_order) AS (
    VALUES ('sum-student-scores', '4 10 20 30 40', '100', true, false, 1),
           ('sum-student-scores', '1 73', '73', false, true, 2),
           ('count-vowels', 'CareerCraft', '4', true, false, 1),
           ('count-vowels', 'rhythm', '0', false, true, 2),
           ('highest-quiz-score', '5 62 91 77 84 90', '91', true, false, 1),
           ('highest-quiz-score', '1 100', '100', false, true, 2)
)
INSERT INTO coding_test_cases (problem_id, input_data, expected_output, is_sample, is_hidden, test_order)
SELECT p.id, c.input_data, c.expected_output, c.is_sample, c.is_hidden, c.test_order
FROM new_cases c JOIN coding_problems p ON p.slug = c.slug
WHERE NOT EXISTS (
    SELECT 1 FROM coding_test_cases tc WHERE tc.problem_id = p.id AND tc.test_order = c.test_order
);

INSERT INTO jobs (
    title, company_name, company_logo_url, description, job_type, employment_type,
    location, work_mode, salary_min, salary_max, salary_currency, skills, requirements,
    responsibilities, eligibility, application_url, application_deadline, category,
    experience_level, is_active
)
SELECT v.title, v.company_name, v.logo, v.description, v.job_type, v.employment_type,
       v.location, v.work_mode, v.salary_min, v.salary_max, 'INR', v.skills::jsonb,
       v.requirements::jsonb, v.responsibilities::jsonb, v.eligibility,
       'https://careercraft.local/demo', v.deadline::date, v.category, 'fresher', true
FROM (VALUES
 ('Part-Time Web Assistant (Student)', 'CampusByte Studio', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=128&auto=format&fit=crop&q=80', 'Sample part-time student role maintaining a community website with a mentor reviewing each change.', 'job', 'part_time', 'Remote, India', 'remote', 8000::numeric, 14000::numeric, '["HTML", "CSS", "JavaScript", "Git"]', '["Currently enrolled student", "Can contribute 10 to 15 hours per week", "Basic HTML and CSS"]', '["Update pages from design notes", "Check mobile layouts", "Join weekly mentor reviews"]', 'Open to current students; schedules can accommodate classes.', '2027-02-28', 'Web Development'),
 ('QA Testing Intern', 'BrightPath Learning Labs', 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=128&auto=format&fit=crop&q=80', 'Sample mentored internship introducing software testing on an education product.', 'internship', 'internship', 'Pune, India', 'hybrid', 12000::numeric, 18000::numeric, '["Software Testing", "Documentation", "Web Apps"]', '["Enrolled in a degree or diploma program", "Comfortable testing websites", "Attention to detail"]', '["Run test checklists", "Write reproducible bug reports", "Retest fixes with developers"]', 'Current students; no prior industry experience required.', '2027-01-31', 'Quality Assurance'),
 ('Data Analytics Intern', 'OpenCampus Insights', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=128&auto=format&fit=crop&q=80', 'Sample student internship using practice datasets to build spreadsheet and SQL skills with a mentor.', 'internship', 'internship', 'Remote, India', 'remote', 15000::numeric, 22000::numeric, '["Excel", "SQL", "Python", "Data Visualization"]', '["Currently pursuing a degree", "Basic spreadsheet skills", "Coursework or a sample data project helpful"]', '["Clean small datasets", "Write introductory SQL queries", "Summarize findings with charts"]', 'Open to second-year and later students; beginners encouraged.', '2027-02-15', 'Data Analytics'),
 ('Campus IT Support Intern', 'Northstar Student Services', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=128&auto=format&fit=crop&q=80', 'Sample campus internship helping students with account setup, classroom technology, and basic troubleshooting under staff supervision.', 'internship', 'internship', 'Chennai, India', 'onsite', 10000::numeric, 16000::numeric, '["IT Support", "Windows", "Networking Basics"]', '["Enrolled student able to work a campus schedule", "Basic computer skills", "Patient communication"]', '["Triage common support requests", "Document troubleshooting steps", "Escalate account or security issues"]', 'Current students; introductory training provided.', '2027-01-20', 'IT Support'),
 ('Junior Content & SEO Assistant', 'StudentWorks Media', 'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=128&auto=format&fit=crop&q=80', 'Sample paid part-time role for students interested in writing and digital marketing, with editorial feedback.', 'job', 'part_time', 'Remote, India', 'remote', 7000::numeric, 12000::numeric, '["Writing", "Research", "SEO Basics"]', '["Current student or recent graduate", "Clear original writing", "Can contribute 8 to 12 hours per week"]', '["Draft short explainers", "Check sources and links", "Update a content calendar"]', 'Student applicants with a writing sample are welcome.', '2027-02-10', 'Marketing & Content'),
 ('Product Operations Intern', 'CampusProduct Lab', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=128&auto=format&fit=crop&q=80', 'Sample internship for students interested in business, project coordination, and product operations. Work with a mentor on research and simple process documentation.', 'internship', 'internship', 'Remote, India', 'remote', 12000::numeric, 18000::numeric, '["Project Coordination", "Research", "Spreadsheets", "Communication"]', '["Currently enrolled student", "Organized written communication", "Basic spreadsheet skills"]', '["Summarize user feedback", "Maintain a project tracker", "Prepare meeting notes and weekly updates"]', 'Open to undergraduate students from any discipline.', '2027-02-20', 'Business & Management'),
 ('Health Data Research Intern', 'CarePath Research Collective', 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=128&auto=format&fit=crop&q=80', 'Sample mentored placement using synthetic, non-identifiable healthcare data to practice data quality checks and evidence summaries.', 'internship', 'internship', 'Remote, India', 'remote', 14000::numeric, 20000::numeric, '["Healthcare", "Research", "Data Quality", "Excel"]', '["Enrolled in a health, life-science, statistics, or related program", "Careful documentation", "Interest in privacy-aware data work"]', '["Check synthetic records for inconsistencies", "Create summary tables", "Document limitations and privacy safeguards"]', 'Current undergraduate students; all exercises use synthetic data.', '2027-02-25', 'Healthcare & Life Sciences'),
 ('Cloud Security Support Intern', 'StackStart Cloud Learning', 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=128&auto=format&fit=crop&q=80', 'Sample introductory internship for students learning cloud operations and security. Practice reviewing configuration checklists in a supervised training environment.', 'internship', 'internship', 'Hyderabad, India', 'hybrid', 15000::numeric, 22000::numeric, '["Cloud Fundamentals", "Linux", "Networking", "Security Basics"]', '["Currently pursuing a technical degree", "Basic command-line familiarity", "Willingness to follow documented security procedures"]', '["Review lab configuration checklists", "Document support tasks", "Escalate security concerns to the mentor"]', 'Pre-final-year students; foundational coursework is sufficient.', '2027-02-28', 'Cloud & Cybersecurity')
) AS v(title, company_name, logo, description, job_type, employment_type, location, work_mode,
       salary_min, salary_max, skills, requirements, responsibilities, eligibility, deadline, category)
WHERE NOT EXISTS (SELECT 1 FROM jobs j WHERE j.title = v.title AND j.company_name = v.company_name);

DO $$
DECLARE v_client_id UUID;
BEGIN
    SELECT id INTO v_client_id FROM users
    ORDER BY CASE WHEN role = 'admin' THEN 0 ELSE 1 END, created_at ASC LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO freelance_projects (
            client_id, title, description, category, skills, budget_type,
            budget_min, budget_max, currency, duration_days, experience_level, status
        )
        SELECT v_client_id, v.title, v.description, v.category, v.skills::jsonb,
               'fixed', v.budget_min, v.budget_max, 'INR', v.duration_days, 'beginner', 'open'
        FROM (VALUES
          ('Student Club Event Landing Page', 'Sample beginner project: make a responsive one-page site for a student club event using supplied copy and images. Include event details and an accessible registration link.', 'Frontend', '["HTML", "CSS", "JavaScript", "Responsive Design"]', 3000::numeric, 6000::numeric, 7),
          ('Spreadsheet Cleanup and Simple Charts', 'Sample student project: organize a small anonymized spreadsheet, standardize categories, and create three charts with a short summary of the data.', 'Data & Analytics', '["Excel", "Google Sheets", "Data Cleaning", "Charts"]', 2500::numeric, 5000::numeric, 5),
          ('Accessible Portfolio Review', 'Sample small project: review a student portfolio on mobile and desktop, identify navigation and contrast issues, and provide a prioritized checklist.', 'Design & Accessibility', '["Accessibility", "Web Design", "Documentation"]', 2000::numeric, 4000::numeric, 4),
          ('Student Club Social Content Calendar', 'Sample beginner project: create a two-week content calendar for a fictional campus event, draft short captions, and suggest simple ways to measure engagement.', 'Marketing & Content', '["Content Writing", "Social Media", "Research"]', 2500::numeric, 4500::numeric, 5),
          ('Campus Event Budget Tracker', 'Sample project: turn a supplied student-club budget into a clear spreadsheet with planned versus actual costs, category totals, and a simple break-even view.', 'Business, Management & Finance', '["Spreadsheets", "Budgeting", "Data Visualization"]', 2500::numeric, 5000::numeric, 5),
          ('Synthetic Clinic Wait-Time Summary', 'Sample learning task using synthetic appointment records: summarize wait times by service type and present a short report with privacy notes and limitations.', 'Healthcare & Life Sciences', '["Healthcare Operations", "Excel", "Data Analysis", "Documentation"]', 3000::numeric, 5500::numeric, 6),
          ('Secure Student Portfolio Deployment Checklist', 'Sample beginner task: write and test a deployment checklist for a static portfolio, including HTTPS, secret handling, backups, and safe access settings.', 'Cloud & Cybersecurity', '["Cloud Fundamentals", "Security Basics", "Documentation"]', 2500::numeric, 5000::numeric, 5)
        ) AS v(title, description, category, skills, budget_min, budget_max, duration_days)
        WHERE NOT EXISTS (SELECT 1 FROM freelance_projects fp WHERE fp.title = v.title);
    END IF;
END $$;
