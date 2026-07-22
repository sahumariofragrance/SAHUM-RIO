import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // true while restoring session from localStorage — prevents login-form flash
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore existing session synchronously from localStorage
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Keep user in sync across login, logout, and automatic token refresh
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error(error.message);
    if (data?.user) setUser(data.user);
    return data.user;
  };

  const signup = async ({ name, email, password }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }, // stored in user_metadata
    });
    if (error) throw new Error(error.message);
    
    // If Supabase requires email confirmation, session will be null
    if (data.user && !data.session) {
      throw new Error("Account created! Please check your email for a confirmation link before logging in.");
    }
    if (data?.user) setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthCtx.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
