// ============================================================
//  DevConnect — Auth Context
//  Provides: user, token, login(), logout(), loading
//  Wrap your entire app with <AuthProvider>
// ============================================================

import { createContext, useContext, useState, useEffect } from "react";
import { authAPI, userAPI } from "../services/api";
import { connectSocket, disconnectSocket } from "../services/socket";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);   // full user object
  const [token, setToken]     = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);   // true while checking existing session

  // On app load — if token exists, fetch current user
  useEffect(() => {
    const init = async () => {
      if (token) {
        try {
          const data = await userAPI.getMe();
          setUser(data.data);
          connectSocket(data.data._id); // connect socket immediately
        } catch {
          // token expired or invalid
          localStorage.removeItem("token");
          setToken(null);
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  // Login — saves token, fetches user, connects socket
  const login = async ({ email, password }) => {
    const data = await authAPI.login({ email, password });
    localStorage.setItem("token", data.token);
    setToken(data.token);
    setUser({ _id: data._id, name: data.name, email: data.email });
    connectSocket(data._id);
    return data;
  };

  // Register — just creates account, redirect to login
  const register = async ({ name, email, password }) => {
    return await authAPI.register({ name, email, password });
  };

  // Logout — clears everything
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    disconnectSocket();
  };

  // Update user in context (e.g. after profile edit)
  const updateUser = (updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook — use this everywhere instead of useContext(AuthContext)
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
