import React, { createContext, useContext, useEffect, useState } from "react";
import api, { getToken, setToken } from "../lib/api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    api("/auth/me")
      .then((data) => setUser(data?.user ?? null))
      .catch(() => {
        setToken("");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async ({ email, password }) => {
    const data = await api("/auth/login", {
      method: "POST",
      noAuth: true,
      body: { email, password },
    });
    setToken(data?.token);
    setUser(data?.user ?? null);
    return data?.user;
  };

  const signup = async ({ name, email, password }) => {
    const data = await api("/auth/signup", {
      method: "POST",
      noAuth: true,
      body: { name, email, password },
    });
    setToken(data?.token);
    setUser(data?.user ?? null);
    return data?.user;
  };

  const logout = async () => {
    setToken("");
    setUser(null);
  };

  return <AuthCtx.Provider value={{ user, loading, login, signup, logout }}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
