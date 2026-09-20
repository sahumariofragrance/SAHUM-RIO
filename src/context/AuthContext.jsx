import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthCtx = createContext(null);

function normalizePhone(value) {
  const raw = String(value || "").trim();
  if (!raw) throw new Error("Please enter your phone number.");

  if (raw.startsWith("+")) {
    const digits = raw.slice(1).replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15) throw new Error("Please enter a valid phone number.");
    return `+${digits}`;
  }

  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  throw new Error("Use a 10-digit Indian number or include the country code, for example +91…");
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
      email,
      password,
    });
    if (error) throw new Error(error.message);
    if (data?.user) setUser(data.user);
    return data.user;
  };

  const requestLoginOtp = async ({ channel, value }) => {
    if (channel === "phone") {
      const phone = normalizePhone(value);
      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: { shouldCreateUser: false },
      });
      if (error) {
        if (/provider|phone|sms/i.test(error.message || "")) {
          throw new Error("Phone OTP is not available for this number yet. Make sure the phone is verified on your account and SMS authentication is enabled.");
        }
        throw new Error(error.message);
      }
      return { channel: "phone", value: phone };
    }

    const email = String(value || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Please enter a valid email address.");
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    if (error) throw new Error(error.message);
    return { channel: "email", value: email };
  };

  const verifyLoginOtp = async ({ channel, value, token }) => {
    const code = String(token || "").replace(/\s/g, "");
    if (!/^\d{6}$/.test(code)) throw new Error("Enter the 6-digit OTP.");

    const credentials = channel === "phone"
      ? { phone: normalizePhone(value), token: code, type: "sms" }
      : { email: String(value || "").trim().toLowerCase(), token: code, type: "email" };

    const { data, error } = await supabase.auth.verifyOtp(credentials);
    if (error) throw new Error(error.message);
    if (!data?.session || !data?.user) throw new Error("OTP verification did not create a login session. Please try again.");

    setUser(data.user);
    return data.user;
  };

  const signup = async ({ name, email, password, newsletterSubscribed = false }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          newsletter_subscribed: Boolean(newsletterSubscribed),
        },
      },
    });
    if (error) throw new Error(error.message);

    if (data.user && !data.session) {
      throw new Error("Account created! Please check your email for a confirmation link before logging in.");
    }
    if (data?.user) setUser(data.user);
    return data.user;
  };

  const requestPhoneVerification = async (phoneInput) => {
    const phone = normalizePhone(phoneInput);
    const { data, error } = await supabase.auth.updateUser({ phone });
    if (error) {
      if (/provider|phone|sms/i.test(error.message || "")) {
        throw new Error("Phone verification is not available yet. SMS authentication must be enabled in Supabase first.");
      }
      throw new Error(error.message);
    }
    if (data?.user) setUser(data.user);
    return phone;
  };

  const verifyPhoneVerification = async ({ phone, token }) => {
    const normalized = normalizePhone(phone);
    const code = String(token || "").replace(/\s/g, "");
    if (!/^\d{6}$/.test(code)) throw new Error("Enter the 6-digit OTP.");

    const { data, error } = await supabase.auth.verifyOtp({
      phone: normalized,
      token: code,
      type: "phone_change",
    });
    if (error) throw new Error(error.message);

    const { data: userResult } = await supabase.auth.getUser();
    const verifiedUser = userResult?.user || data?.user || null;
    if (verifiedUser) setUser(verifiedUser);

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ phone: normalized, updated_at: new Date().toISOString() })
      .eq("id", verifiedUser?.id || user?.id);

    if (profileError) console.error("[auth] verified phone profile sync failed", profileError.message);
    return normalized;
  };

  const requestPasswordReset = async (email) => {
    const stablePreviewOrigin = "https://sahum-rio-git-rebuild-complete-backend-v2-sahumarios-projects.vercel.app";
    const isVercelPreview = window.location.hostname.endsWith(".vercel.app");
    const redirectOrigin = isVercelPreview ? stablePreviewOrigin : window.location.origin;
    const redirectTo = `${redirectOrigin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
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
        signup,
        logout,
        requestLoginOtp,
        verifyLoginOtp,
        requestPhoneVerification,
        verifyPhoneVerification,
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
