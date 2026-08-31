import { createContext, useContext, useState, useEffect } from "react";
import { setAuthToken } from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(!!localStorage.getItem("adminToken"));
  const [adminName, setAdminName] = useState(
    localStorage.getItem("adminName") || "",
  );

  useEffect(() => {
    let token = null;
    try {
      token = localStorage.getItem("adminToken");
    } catch (e) {
      token = null;
    }
    // ensure axios has the token in memory (fallback for browsers blocking localStorage)
    setAuthToken(token);
  }, []);

  const login = (token, username) => {
    try {
      localStorage.setItem("adminToken", token);
      localStorage.setItem("adminName", username);
    } catch (e) {
      // localStorage unavailable — rely on module token
      document.cookie = `adminToken=${token}; path=/; Secure; SameSite=Strict`;
      document.cookie = `adminName=${encodeURIComponent(username)}; path=/; Secure; SameSite=Strict`;
    }
    // ensure axios instance has the header immediately
    setAuthToken(token);
    setIsAdmin(true);
    setAdminName(username);
  };

  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminName");
    try {
      document.cookie = "adminToken=; path=/; max-age=0";
      document.cookie = "adminName=; path=/; max-age=0";
    } catch (e) {}
    setAuthToken(null);
    setIsAdmin(false);
    setAdminName("");
  };

  return (
    <AuthContext.Provider value={{ isAdmin, adminName, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
