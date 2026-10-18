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
