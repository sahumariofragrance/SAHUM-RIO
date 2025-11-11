import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";

const AuthCtx = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("sahu_token") || "");
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("sahu_user");
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    if (token) localStorage.setItem("sahu_token", token);
    else localStorage.removeItem("sahu_token");
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem("sahu_user", JSON.stringify(user));
    else localStorage.removeItem("sahu_user");
  }, [user]);

  const signup = async ({ name, email, password }) => {
    const res = await api("/auth/signup", { method: "POST", body: { name, email, password } });
    setToken(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const login = async ({ email, password }) => {
    const res = await api("/auth/login", { method: "POST", body: { email, password } });
    setToken(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    setToken("");
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ token, user, login, signup, logout, setUser }}>
      {children}
    </AuthCtx.Provider>
  );
}
export function useAuth() { return useContext(AuthCtx); }