import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthCtx = createContext(null);

function normalizeEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Please enter a valid email address.");
  }
  return email;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizeEmail(email),
      password,
    });
    if (error) throw new Error(error.message);
    if (data?.user) setUser(data.user);
    return data.user;
  };

  const requestEmailOtp = async ({
    email,
    createUser = false,
    name = "",
    newsletterSubscribed = false,
  }) => {
    const normalizedEmail = normalizeEmail(email);
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: Boolean(createUser),
        data: createUser
          ? {
              name: String(name || "").trim(),
              newsletter_subscribed: Boolean(newsletterSubscribed),
            }
          : undefined,
      },
    });

    if (error) throw new Error(error.message);
    return normalizedEmail;
  };

  const verifyEmailOtp = async ({ email, token }) => {
    const normalizedEmail = normalizeEmail(email);
    const code = String(token || "").replace(/\s/g, "");
    if (!/^\d{6}$/.test(code)) throw new Error("Enter the 6-digit OTP.");

    const { data, error } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: code,
      type: "email",
    });

    if (error) throw new Error(error.message);
    if (!data?.session || !data?.user) {
      throw new Error("OTP verification did not create a login session. Please try again.");
    }

    setUser(data.user);
    return data.user;
  };

  const requestPasswordReset = async (email) => {
    const stablePreviewOrigin = "https://sahum-rio-git-rebuild-complete-backend-v2-sahumarios-projects.vercel.app";
    const isVercelPreview = window.location.hostname.endsWith(".vercel.app");
    const redirectOrigin = isVercelPreview ? stablePreviewOrigin : window.location.origin;
    const redirectTo = `${redirectOrigin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(normalizeEmail(email), { redirectTo });
    if (error) throw new Error(error.message);
  };

  const updatePassword = async (password) => {
    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message);
    return data.user;
  };

  const startGuestSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) return session;
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw new Error(error.message);
    if (data?.user) setUser(data.user);
    return data.session;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  };

  return (
    <AuthCtx.Provider
      value={{
        user,
        loading,
        login,
        logout,
        requestEmailOtp,
        verifyEmailOtp,
        requestPasswordReset,
        updatePassword,
        startGuestSession,
        isGuest: Boolean(user?.is_anonymous),
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
