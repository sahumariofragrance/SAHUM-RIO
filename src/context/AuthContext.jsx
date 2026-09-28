import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { IDLE_LIMIT_MS, isIdleTimerHeld, lastActivity, markActivity, storedActivity } from "../lib/idleLogout";

const ACTIVITY_EVENTS = ["pointerdown", "keydown", "scroll", "touchstart", "wheel", "mousemove"];
const IDLE_CHECK_MS = 30 * 1000;

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
  const [idleSignedOut, setIdleSignedOut] = useState(false);
  const userIdRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      userIdRef.current = session?.user?.id ?? null;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextId = session?.user?.id ?? null;
      // A different account just signed in (login, OTP, reset link): start its clock now.
      if (nextId && nextId !== userIdRef.current) markActivity({ force: true });
      userIdRef.current = nextId;
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Customers (not guests, not the admin) are signed out after IDLE_LIMIT_MS
  // without activity, across all tabs and including time the site was closed.
  useEffect(() => {
    if (loading || !user || user.is_anonymous) return undefined;
    let cancelled = false;
    let cleanup = () => {};

    supabase.rpc("is_admin").then(({ data, error }) => {
      if (cancelled || (!error && data === true)) return;

      const signOutIfIdle = async ({ onLoad = false } = {}) => {
        if (isIdleTimerHeld()) return;
        const last = onLoad ? storedActivity() : lastActivity();
        if (!last || Date.now() - last < IDLE_LIMIT_MS) return;
        cleanup();
        // Set before signing out: the sign-out re-renders and cancels this effect.
        setIdleSignedOut(true);
        await supabase.auth.signOut().catch(() => {});
      };

      // Returning after the site was closed: judge by the stored timestamp only.
      signOutIfIdle({ onLoad: true }).then(() => {
        if (cancelled) return;
        markActivity({ force: true });
        const onActivity = () => markActivity();
        const onVisible = () => { if (document.visibilityState === "visible") signOutIfIdle(); };
        ACTIVITY_EVENTS.forEach((name) => window.addEventListener(name, onActivity, { passive: true }));
        document.addEventListener("visibilitychange", onVisible);
        const timer = window.setInterval(signOutIfIdle, IDLE_CHECK_MS);
        cleanup = () => {
          ACTIVITY_EVENTS.forEach((name) => window.removeEventListener(name, onActivity));
          document.removeEventListener("visibilitychange", onVisible);
          window.clearInterval(timer);
          cleanup = () => {};
        };
      });
    });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [loading, user]);

  const login = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizeEmail(email),
      password,
    });
    if (error) throw new Error(error.message);
    markActivity({ force: true });
    setIdleSignedOut(false);
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
    if (!/^\d{8}$/.test(code)) throw new Error("Enter the 8-digit OTP.");

    const { data, error } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: code,
      type: "email",
    });

    if (error) throw new Error(error.message);
    if (!data?.session || !data?.user) {
      throw new Error("OTP verification did not create a login session. Please try again.");
    }

    markActivity({ force: true });
    setIdleSignedOut(false);
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
      {idleSignedOut && (
        <div role="status" className="fixed inset-x-4 bottom-4 z-[9998] mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3.5 text-sm text-[var(--color-text)] shadow-[0_18px_50px_-20px_rgba(0,0,0,0.45)]">
          <p className="flex-1 leading-6">You were signed out after 20 minutes of inactivity. Your cart is still saved — log in again to continue.</p>
          <button type="button" onClick={() => setIdleSignedOut(false)} className="shrink-0 rounded-full px-2 py-1 text-xs font-semibold text-[var(--color-muted)] hover:text-[var(--color-text)]" aria-label="Dismiss">OK</button>
        </div>
      )}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
