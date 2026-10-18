/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

const ThemeContext = createContext(null);

/**
 * Resolves 'system' preference to 'light' or 'dark'
 * based on the OS/browser prefers-color-scheme media query.
 */
function resolveTheme(preference) {
  if (preference === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return preference === "light" ? "light" : "dark";
}

/**
 * Applies the resolved theme to the <html> element.
 * Uses data-theme attribute + class for maximum CSS flexibility.
 */
function applyTheme(resolved) {
  const html = document.documentElement;
  html.setAttribute("data-theme", resolved);
  html.classList.remove("light", "dark");
  html.classList.add(resolved);
}

/**
 * ThemeProvider — wraps the entire app.
 * Reads from localStorage first (fast, no flash).
 * Once authenticated, syncs with server-stored preference.
 */
export function ThemeProvider({ children }) {
  // Start from localStorage for zero-flash startup
  const [preference, setPreference] = useState(() => {
    try {
      const stored = localStorage.getItem("cc_theme");
      if (stored && ["light", "dark", "system"].includes(stored)) return stored;
    } catch {
      // Ignore storage errors
    }
    return "dark"; // CareerCraft default
  });

  // Apply resolved theme whenever preference changes
  useEffect(() => {
    const resolved = resolveTheme(preference);
    applyTheme(resolved);
    try {
      localStorage.setItem("cc_theme", preference);
    } catch {
      // Ignore storage errors
    }
  }, [preference]);

  // Re-apply when system preference changes (only relevant when preference === 'system')
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (preference === "system") {
        applyTheme(resolveTheme("system"));
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [preference]);

  /**
   * Called after the user changes theme in Settings.
   * Immediately applies the theme and persists to localStorage.
   * The Settings page separately persists to the server.
   */
  const setTheme = useCallback((newPreference) => {
    if (!["light", "dark", "system"].includes(newPreference)) return;
    setPreference(newPreference);
  }, []);

  /**
   * Called on login to sync server-stored preference.
   * Only updates if server returns a valid value.
   */
  const syncThemeFromServer = useCallback((serverTheme) => {
    if (serverTheme && ["light", "dark", "system"].includes(serverTheme)) {
      setPreference(serverTheme);
    }
  }, []);

  const resolved = resolveTheme(preference);

  const value = {
    theme: preference,       // 'light' | 'dark' | 'system'
    resolvedTheme: resolved, // 'light' | 'dark' (never 'system')
    setTheme,
    syncThemeFromServer,
    isDark: resolved === "dark",
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export default ThemeContext;