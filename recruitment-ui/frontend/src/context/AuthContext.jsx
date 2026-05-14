import { createContext, useContext, useState, useEffect } from "react";
import { API_BASE } from "../api/client";
import { getLandingPath, isRecruiterRole, normalizeRole } from "../utils/auth";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("auth_user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      const parsedUser = JSON.parse(storedUser);
      setUser({ ...parsedUser, role: normalizeRole(parsedUser.role) });
    }
    setLoading(false);
  }, []);

  const register = async (
    email,
    password,
    name,
    role = "recruiter",
    company,
    phone,
  ) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name, role, company, phone }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Registration failed");
    }

    const data = await res.json();
    setToken(data.token);
    const userData = {
      id: data.id,
      email: data.email,
      name: data.name,
      role: normalizeRole(data.role),
    };
    setUser(userData);
    localStorage.setItem("auth_token", data.token);
    localStorage.setItem("auth_user", JSON.stringify(userData));
    return data;
  };

  const login = async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Login failed");
    }

    const data = await res.json();
    setToken(data.token);
    const userData = {
      id: data.id,
      email: data.email,
      name: data.name,
      role: normalizeRole(data.role),
      company: data.company,
      phone: data.phone,
    };
    setUser(userData);
    localStorage.setItem("auth_token", data.token);
    localStorage.setItem("auth_user", JSON.stringify(userData));
    return data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
  };

  const updateProfile = async (updates) => {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Profile update failed");
    }

    const data = await res.json();
    const userData = {
      ...user,
      name: data.name,
      company: data.company,
      phone: data.phone,
    };
    setUser(userData);
    localStorage.setItem("auth_user", JSON.stringify(userData));
    return data;
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    isRecruiter: isRecruiterRole(user?.role),
    isCandidate: normalizeRole(user?.role) === "candidate",
    landingPath: getLandingPath(user?.role),
    register,
    login,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
