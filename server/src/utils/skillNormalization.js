/**
 * Skill Normalization Utility
 * 
 * Normalizes skill names and aliases ONLY for recommendation matching and gap calculations.
 * IMPORTANT: This utility never mutates or overwrites the original skill names stored in PostgreSQL.
 */

// Canonical alias dictionary for tech skills
const CANONICAL_ALIASES = {
  // JavaScript & Variants
  "js": "javascript",
  "javascript": "javascript",
  "java script": "javascript",
  "es6": "javascript",
  "es6+": "javascript",
  "ecmascript": "javascript",

  // TypeScript
  "ts": "typescript",
  "typescript": "typescript",

  // React & Next
  "react": "react",
  "reactjs": "react",
  "react.js": "react",
  "react-js": "react",
  "next": "next.js",
  "nextjs": "next.js",
  "next.js": "next.js",

  // Node & Express
  "node": "node.js",
  "nodejs": "node.js",
  "node.js": "node.js",
  "node-js": "node.js",
  "express": "express",
  "expressjs": "express",
  "express.js": "express",

  // Databases
  "postgres": "postgresql",
  "postgresql": "postgresql",
  "postgre": "postgresql",
  "pgsql": "postgresql",
  "psql": "postgresql",
  "mongo": "mongodb",
  "mongodb": "mongodb",
  "mongo db": "mongodb",
  "sql": "sql",
  "mysql": "mysql",
  "sqlite": "sqlite",
  "redis": "redis",

  // Python & Data Science
  "py": "python",
  "python": "python",
  "python3": "python",
  "pandas": "pandas",
  "numpy": "numpy",
  "scikit-learn": "scikit-learn",
  "scikitlearn": "scikit-learn",
  "sklearn": "scikit-learn",
  "pytorch": "pytorch",
  "torch": "pytorch",
  "tensorflow": "tensorflow",
  "tf": "tensorflow",
  "ml": "machine learning",
  "machine learning": "machine learning",
  "machine-learning": "machine learning",
  "ai": "artificial intelligence",
  "artificial intelligence": "artificial intelligence",
  "deep learning": "deep learning",
  "dl": "deep learning",
  "nlp": "nlp",
  "natural language processing": "nlp",
  "llm": "llms",
  "llms": "llms",
  "large language models": "llms",

  // Frontend & Styling
  "html": "html",
  "html5": "html",
  "css": "css",
  "css3": "css",
  "tailwind": "tailwind css",
  "tailwindcss": "tailwind css",
  "tailwind css": "tailwind css",
  "bootstrap": "bootstrap",
  "sass": "sass",
  "scss": "sass",

  // Cloud & DevOps
  "k8s": "kubernetes",
  "kubernetes": "kubernetes",
  "docker": "docker",
  "aws": "aws",
  "amazon web services": "aws",
  "gcp": "google cloud",
  "google cloud platform": "google cloud",
  "azure": "azure",
  "microsoft azure": "azure",
  "ci/cd": "ci/cd",
  "cicd": "ci/cd",
  "git": "git",
  "github": "git",
  "gitlab": "git",
  "linux": "linux",
  "bash": "bash",
  "shell": "bash",

  // Mobile
  "react native": "react native",
  "react-native": "react native",
  "flutter": "flutter",
  "android": "android",
  "ios": "ios",
  "kotlin": "kotlin",
  "swift": "swift",

  // Design
  "figma": "figma",
  "ui design": "ui design",
  "ux design": "ux research",
  "ux research": "ux research",
  "wireframing": "wireframing",
  "prototyping": "prototyping",
  "design systems": "design systems",

  // General CS / Testing
  "algorithms": "algorithms",
  "algo": "algorithms",
  "data structures": "data structures",
  "dsa": "data structures",
  "oop": "object-oriented programming",
  "object-oriented programming": "object-oriented programming",
  "rest api": "rest apis",
  "rest apis": "rest apis",
  "restful api": "rest apis",
  "selenium": "selenium",
  "cypress": "cypress",
  "jest": "jest",
  "test automation": "test automation",
};

/**
 * Normalizes a skill string to its canonical matching token.
 * Lowercases, strips excess whitespace, and resolves common synonyms.
 * 
 * @param {string} rawName 
 * @returns {string} Normalized skill string
 */
export function normalizeSkillName(rawName) {
  if (!rawName || typeof rawName !== "string") return "";
  
  const cleaned = rawName.trim().toLowerCase().replace(/\s+/g, " ");
  
  if (CANONICAL_ALIASES[cleaned]) {
    return CANONICAL_ALIASES[cleaned];
  }
  
  // Try punctuation-stripped alias lookup (e.g., "react.js" -> "react js")
  const stripped = cleaned.replace(/[-_.]/g, " ").replace(/\s+/g, " ");
  if (CANONICAL_ALIASES[stripped]) {
    return CANONICAL_ALIASES[stripped];
  }

  return cleaned;
}

/**
 * Checks if a user's skill matches a required career path skill.
 * 
 * @param {string} userSkillName 
 * @param {string} requiredSkillName 
 * @returns {boolean}
 */
export function skillsMatch(userSkillName, requiredSkillName) {
  const normUser = normalizeSkillName(userSkillName);
  const normReq = normalizeSkillName(requiredSkillName);
  
  if (!normUser || !normReq) return false;
  if (normUser === normReq) return true;

  // Exact substring containment if at least 4 characters (prevents false matches on "c", "r", "go")
  if (normUser.length >= 4 && normReq.length >= 4) {
    if (normUser.includes(normReq) || normReq.includes(normUser)) {
      return true;
    }
  }

  return false;
}

/**
 * Converts qualitative proficiency label to a numerical scale (0 - 100).
 * 
 * @param {string} proficiency 
 * @returns {number}
 */
export function getProficiencyWeight(proficiency) {
  if (!proficiency) return 40; // Default baseline for registered skill
  const p = String(proficiency).trim().toLowerCase();
  
  switch (p) {
    case "expert":
      return 100;
    case "advanced":
      return 80;
    case "intermediate":
      return 60;
    case "beginner":
      return 40;
    default:
      return 50;
  }
}
