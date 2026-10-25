/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Manual / on-demand session verification & refresh
  const refreshUser = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/auth/me");
      if (res?.success && res?.user) {
        setUser(res.user);
        return res.user;
      } else {
        setUser(null);
        return null;
      }
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkAuth = refreshUser;

  // Initial session verification on startup
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const res = await api.get("/auth/me");
        if (isMounted) {
          if (res?.success && res?.user) {
            setUser(res.user);
          } else {
            setUser(null);
          }
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    if (res?.success && res?.user) {
      if (res.token) {
        try { localStorage.setItem("careercraft_token", res.token); } catch {}
      }
      setUser(res.user);
    }
    return res;
  };

  const register = async (name, email, password) => {
    const res = await api.post("/auth/register", { name, email, password });
    if (res?.success && res?.user) {
      if (res.token) {
        try { localStorage.setItem("careercraft_token", res.token); } catch {}
      }
      setUser(res.user);
    }
    return res;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout request error:", err?.message || err);
    } finally {
      try { localStorage.removeItem("careercraft_token"); } catch {}
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
    checkAuth,
    isAuthenticated: Boolean(user),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
