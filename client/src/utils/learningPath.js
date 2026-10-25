const SELECTED_DOMAIN_KEY = "careercraft-selected-domain";

export function getSelectedDomain() {
  try {
    return localStorage.getItem(SELECTED_DOMAIN_KEY) || "";
  } catch {
    return "";
  }
}

export function setSelectedDomain(domain) {
  try {
    if (domain) localStorage.setItem(SELECTED_DOMAIN_KEY, domain);
    else localStorage.removeItem(SELECTED_DOMAIN_KEY);
  } catch {
    // Domain navigation still works when browser storage is unavailable.
  }
}

export const OFFICIAL_DOMAINS = [
  {
    id: "full-stack-development",
    name: "Full Stack Development",
    shortName: "Full Stack",
    eyebrow: "End-to-end engineering",
    description: "Build complete web applications with modern frontend frameworks, APIs, and scalable databases.",
    roles: ["Full Stack Developer", "Frontend Engineer", "Backend Developer", "Web Developer"],
    skills: ["React", "Node.js", "JavaScript", "TypeScript", "PostgreSQL", "HTML/CSS", "REST APIs"],
    icon: "Layers",
    color: "violet",
  },
  {
    id: "ai-machine-learning",
    name: "AI & Machine Learning",
    shortName: "AI / ML",
    eyebrow: "Intelligent systems",
    description: "Design intelligent algorithms, train neural models, and build cutting-edge artificial intelligence systems.",
    roles: ["ML Engineer", "AI Developer", "Deep Learning Specialist", "Research Scientist"],
    skills: ["Python", "PyTorch", "TensorFlow", "Scikit-Learn", "Neural Networks", "NLP", "Computer Vision"],
    icon: "Sparkles",
    color: "purple",
  },
  {
    id: "data-science-analytics",
    name: "Data Science & Analytics",
    shortName: "Data Science",
    eyebrow: "Insights & prediction",
    description: "Transform complex data into actionable business intelligence, statistical models, and predictive forecasts.",
    roles: ["Data Scientist", "Data Analyst", "BI Developer", "Quantitative Analyst"],
    skills: ["Python", "SQL", "Pandas", "Tableau", "Power BI", "Statistics", "Data Visualization"],
    icon: "BarChart3",
    color: "cyan",
  },
  {
    id: "java-development",
    name: "Java Development",
    shortName: "Java Dev",
    eyebrow: "Enterprise engineering",
    description: "Master enterprise software engineering, microservices architectures, and high-performance backend systems with Java.",
    roles: ["Java Developer", "Backend Engineer", "Enterprise Software Engineer", "Spring Boot Developer"],
    skills: ["Java", "Spring Boot", "Hibernate", "Microservices", "PostgreSQL", "OOP", "JUnit"],
    icon: "Coffee",
    color: "amber",
  },
  {
    id: "python-development",
    name: "Python Development",
    shortName: "Python Dev",
    eyebrow: "Scripting & platforms",
    description: "Harness Python for scalable web backends, automation scripts, system utilities, and data-driven applications.",
    roles: ["Python Developer", "Backend Engineer", "Automation Engineer", "Software Developer"],
    skills: ["Python", "Django", "FastAPI", "Flask", "PostgreSQL", "Docker", "REST APIs"],
    icon: "Terminal",
    color: "emerald",
  },
  {
    id: "ui-ux-product-design",
    name: "UI/UX & Product Design",
    shortName: "UI/UX Design",
    eyebrow: "Human-centered products",
    description: "Craft human-centered user experiences, wireframes, accessible interactive design systems, and delightful digital products.",
    roles: ["UI/UX Designer", "Product Designer", "User Researcher", "Design Systems Engineer"],
    skills: ["Figma", "User Research", "Wireframing", "Prototyping", "Design Systems", "Usability Testing", "Accessibility"],
    icon: "Palette",
    color: "pink",
  },
  {
    id: "cybersecurity",
    name: "Cybersecurity",
    shortName: "Cybersecurity",
    eyebrow: "Defense & infrastructure",
    description: "Defend networks, identify system vulnerabilities, safeguard cloud infrastructure, and protect critical digital assets.",
    roles: ["Security Analyst", "SOC Analyst", "Penetration Tester", "Information Security Engineer"],
    skills: ["Network Security", "Ethical Hacking", "Linux", "SIEM", "Cryptography", "Incident Response", "Vulnerability Assessment"],
    icon: "ShieldAlert",
    color: "rose",
  },
  {
    id: "digital-marketing",
    name: "Digital Marketing",
    shortName: "Marketing",
    eyebrow: "Audience & growth",
    description: "Drive organic audience growth, analyze search trends, craft content strategies, and run high-ROI digital campaigns.",
    roles: ["Digital Marketer", "Growth Strategist", "SEO Specialist", "Performance Marketing Associate"],
    skills: ["SEO", "Content Strategy", "Google Analytics", "Social Media Marketing", "Email Marketing", "Copywriting", "Paid Ads"],
    icon: "Megaphone",
    color: "orange",
  },
];

const DOMAIN_TERMS = {
  // 8 Official Domains
  "full stack development": ["full stack", "fullstack", "web", "react", "node", "javascript", "frontend", "backend", "html", "css", "sql", "postgres", "developer", "software"],
  "ai & machine learning": ["ai", "machine learning", "ml", "artificial intelligence", "deep learning", "neural", "nlp", "computer vision", "data", "model", "python"],
  "data science & analytics": ["data science", "data analytics", "data analyst", "data scientist", "sql", "analytics", "statistics", "pandas", "visualization", "bi", "tableau", "power bi", "excel", "python"],
  "java development": ["java", "spring", "springboot", "spring boot", "backend", "oop", "jvm", "hibernate", "microservices"],
  "python development": ["python", "django", "fastapi", "flask", "backend", "automation", "scripting", "data"],
  "ui/ux & product design": ["ui", "ux", "ui/ux", "product design", "design", "figma", "wireframe", "prototype", "user experience", "user interface", "frontend"],
  "cybersecurity": ["cyber", "security", "cybersecurity", "infosec", "network", "penetration", "ethical hacking", "vulnerability", "firewall", "linux"],
  "digital marketing": ["marketing", "digital marketing", "seo", "content", "social media", "growth", "campaign", "analytics", "copywriting", "sem", "advertising"],

  // Historical / Course Category Aliases
  "it & software": ["software", "developer", "engineering", "frontend", "backend", "web", "programming", "coding", "react", "javascript", "python", "java", "mobile", "qa", "it support"],
  "programming languages": ["programming", "developer", "software", "python", "java", "c++", "backend", "engineering", "coding"],
  "web development": ["web", "frontend", "front-end", "html", "css", "react", "javascript", "website"],
  "data & analytics": ["data", "analytics", "sql", "machine learning", "statistics", "python", "bi", "report", "spreadsheet"],
  "cloud & cybersecurity": ["cloud", "cyber", "security", "devops", "aws", "network", "infrastructure", "platform"],
  "marketing & content": ["marketing", "content", "seo", "social media", "writing", "campaign", "copy"],
  "business, management & finance": ["business", "finance", "project", "management", "budget", "operations", "analyst", "product", "startup"],
  "business & management": ["business", "project", "management", "operations", "product", "startup"],
  "business & finance": ["business", "finance", "budget", "accounting", "analyst"],
  "healthcare & life sciences": ["health", "clinic", "medical", "life science", "biotech", "patient", "clinical", "healthcare"],
  databases: ["database", "sql", "postgresql", "data engineer", "backend"],
  "data structures & algorithms": ["algorithm", "data structure", "software", "coding", "programming", "developer"],
};

export function isRelatedToDomain(item, domain = getSelectedDomain()) {
  if (!domain) return true;
  const terms = DOMAIN_TERMS[domain.trim().toLowerCase()];
  if (!terms) return true;

  const values = [
    item?.title,
    item?.name,
    item?.headline,
    item?.description,
    item?.category,
    item?.slug,
    item?.difficulty,
    item?.companyName,
    item?.company_name,
    item?.employmentType,
    item?.jobType,
    ...(Array.isArray(item?.skills) ? item.skills : []),
    ...(Array.isArray(item?.tags) ? item.tags : []),
    ...(Array.isArray(item?.requirements) ? item.requirements : []),
    ...(Array.isArray(item?.responsibilities) ? item.responsibilities : []),
    ...(Array.isArray(item?.tech_stack) ? item.tech_stack : []),
  ];
  const searchable = values.filter(Boolean).join(" ").toLowerCase();
  return terms.some((term) => searchable.includes(term));
}
