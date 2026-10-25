const SELECTED_DOMAIN_KEY = "careercraft-selected-domain";

export function getSelectedDomain() {
  try { return localStorage.getItem(SELECTED_DOMAIN_KEY) || ""; }
  catch { return ""; }
}

export function setSelectedDomain(domain) {
  try {
    if (domain) localStorage.setItem(SELECTED_DOMAIN_KEY, domain);
    else localStorage.removeItem(SELECTED_DOMAIN_KEY);
  } catch {
    // Domain navigation still works when browser storage is unavailable.
  }
}

const DOMAIN_TERMS = {
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
    item?.description,
    item?.category,
    item?.companyName,
    item?.company_name,
    item?.employmentType,
    item?.jobType,
    ...(Array.isArray(item?.skills) ? item.skills : []),
    ...(Array.isArray(item?.requirements) ? item.requirements : []),
    ...(Array.isArray(item?.responsibilities) ? item.responsibilities : []),
  ];
  const searchable = values.filter(Boolean).join(" ").toLowerCase();
  return terms.some((term) => searchable.includes(term));
}
