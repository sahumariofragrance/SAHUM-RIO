"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowser } from "./supabase-browser";

const AuthContext = createContext(null);

function normalizeEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Please enter a valid email address.");
  }
  return email;
}

export function AuthProvider({ children }) {
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function login({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizeEmail(email),
      password,
    });
    if (error) throw new Error(error.message);
    return data.user;
  }

  async function requestEmailOtp({ email, createUser = false, name = "", newsletterSubscribed = false }) {
    const normalizedEmail = normalizeEmail(email);
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: Boolean(createUser),
        data: createUser ? {
          name: String(name || "").trim(),
          newsletter_subscribed: Boolean(newsletterSubscribed),
        } : undefined,
      },
    });
    if (error) throw new Error(error.message);
    return normalizedEmail;
  }

  async function verifyEmailOtp({ email, token }) {
    const normalizedEmail = normalizeEmail(email);
    const code = String(token || "").replace(/\s/g, "");
    if (!/^\d{8}$/.test(code)) throw new Error("Enter the 8-digit OTP.");

    const { data, error } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: code,
      type: "email",
    });
    if (error) throw new Error(error.message);
    if (!data?.session || !data?.user) throw new Error("OTP verification did not create a login session.");
    return data.user;
  }

  async function requestPasswordReset(email) {
    const isVercelPreview = window.location.hostname.endsWith(".vercel.app");
    const origin = isVercelPreview
      ? "https://sahum-rio-git-migration-nextjs-preview-sahumarios-projects.vercel.app"
      : window.location.origin;
    const redirectTo = `${origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(normalizeEmail(email), { redirectTo });
    if (error) throw new Error(error.message);
  }

  async function updatePassword(password) {
    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message);
    return data.user;
  }

  async function startGuestSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) return session;

    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw new Error(error.message);
    return data.session;
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  }

  const value = {
    user,
    loading,
    isGuest: Boolean(user?.is_anonymous),
    login,
    logout,
    requestEmailOtp,
    verifyEmailOtp,
    requestPasswordReset,
    updatePassword,
    startGuestSession,
    supabase,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
