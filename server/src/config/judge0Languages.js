/**
 * CareerCraft Judge0 CE Language Configuration
 * 
 * Maps verified language identifiers supported by CareerCraft's Monaco editor
 * to trusted Judge0 CE language IDs.
 * 
 * Never allow arbitrary, unvalidated language IDs from client input.
 */

export const JUDGE0_LANGUAGES = {
    javascript: {
        id: 63, // JavaScript (Node.js 12.14.0 / compatible with 93+)
        name: "JavaScript (Node.js)",
        monacoLang: "javascript",
    },
    python: {
        id: 71, // Python (3.8.1 / compatible with 92+)
        name: "Python 3",
        monacoLang: "python",
    },
    java: {
        id: 62, // Java (OpenJDK 13.0.1 / compatible with 91+)
        name: "Java",
        monacoLang: "java",
    },
    cpp: {
        id: 54, // C++ (GCC 9.2.0)
        name: "C++",
        monacoLang: "cpp",
    },
    typescript: {
        id: 74, // TypeScript (3.7.4)
        name: "TypeScript",
        monacoLang: "typescript",
    },
};

/**
 * Validates and resolves a client-supplied language name to a trusted Judge0 language ID.
 *
 * @param {string} languageName - e.g. "javascript", "python"
 * @returns {number|null} - Verified Judge0 language ID or null if unsupported
 */
export function getJudge0LanguageId(languageName) {
    if (!languageName || typeof languageName !== "string") {
        return null;
    }
    const normalized = languageName.toLowerCase().trim();
    const config = JUDGE0_LANGUAGES[normalized];
    return config ? config.id : null;
}

export default JUDGE0_LANGUAGES;
