"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "./auth";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, requestEmailOtp, verifyEmailOtp, requestPasswordReset } = useAuth();
  const [mode, setMode] = useState("login");
  const [loginMethod, setLoginMethod] = useState("password");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", newsletterSubscribed: false });
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(searchParams.get("message") || "");

  const isLogin = mode === "login";
  const isSignup = mode === "signup";

  function resetOtp() {
    setOtpSent(false);
    setOtpCode("");
    setError("");
    setMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (mode === "forgot") {
        await requestPasswordReset(form.email);
        setMessage("If an account exists for that email, a password reset link has been sent.");
        return;
      }

      if (isSignup || loginMethod === "otp") {
        if (!otpSent) {
          const email = await requestEmailOtp({
            email: form.email,
            createUser: isSignup,
            name: form.name,
            newsletterSubscribed: form.newsletterSubscribed,
          });
          setForm(current => ({ ...current, email }));
          setOtpSent(true);
          setMessage("We sent an 8-digit verification code to your email.");
          return;
        }

        await verifyEmailOtp({ email: form.email, token: otpCode });
        router.push("/account");
        router.refresh();
        return;
      }

      await login({ email: form.email, password: form.password });
      router.push("/account");
      router.refresh();
    } catch (err) {
      setError(err?.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-md px-5 py-14 sm:px-8 md:py-20">
      <p className="text-center text-[9px] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">SAHUMäRIO account</p>
      <h1 className="mt-4 text-center font-serif text-4xl font-normal">
        {mode === "forgot" ? "Reset password" : isLogin ? "Welcome back" : "Create account"}
      </h1>

      {isLogin && mode !== "forgot" && (
        <div className="mt-7 grid grid-cols-2 rounded-xl bg-[var(--color-surface-muted)] p-1">
          <button type="button" onClick={() => { setLoginMethod("password"); resetOtp(); }} className={"rounded-lg px-3 py-2 text-sm font-medium " + (loginMethod === "password" ? "bg-[var(--color-surface)] shadow-sm" : "text-[var(--color-muted)]")}>Password</button>
          <button type="button" onClick={() => { setLoginMethod("otp"); resetOtp(); }} className={"rounded-lg px-3 py-2 text-sm font-medium " + (loginMethod === "otp" ? "bg-[var(--color-surface)] shadow-sm" : "text-[var(--color-muted)]")}>Email OTP</button>
        </div>
      )}

      {error && <div className="mt-6 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"><AlertCircle className="h-5 w-5 shrink-0" /><p className="text-sm">{error}</p></div>}
      {message && <div className="mt-6 flex gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800"><CheckCircle2 className="h-5 w-5 shrink-0" /><p className="text-sm">{message}</p></div>}

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {isSignup && !otpSent && (
          <label className="block text-sm">Full name
            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 outline-none focus:ring-2 focus:ring-amber-600" />
          </label>
        )}

        {!otpSent && (
          <label className="block text-sm">Email
            <input required type="email" autoComplete="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 outline-none focus:ring-2 focus:ring-amber-600" />
          </label>
        )}

        {isLogin && loginMethod === "password" && mode !== "forgot" && (
          <div>
            <div className="flex items-center justify-between gap-3"><label className="text-sm">Password</label><button type="button" onClick={() => { setMode("forgot"); resetOtp(); }} className="text-sm font-medium text-amber-600">Forgot password?</button></div>
            <div className="relative mt-1">
              <input required minLength={6} type={showPassword ? "text" : "password"} autoComplete="current-password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 pr-11 outline-none focus:ring-2 focus:ring-amber-600" />
              <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute inset-y-0 right-2 flex items-center px-1 text-[var(--color-muted)]">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
            </div>
          </div>
        )}

        {isSignup && !otpSent && (
          <label className="flex items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
            <input type="checkbox" checked={form.newsletterSubscribed} onChange={e => setForm({ ...form, newsletterSubscribed: e.target.checked })} className="mt-1 h-4 w-4" />
            <span><span className="block text-sm font-medium">Keep me in the SAHUMäRIO loop</span><span className="mt-1 block text-xs leading-5 text-[var(--color-muted)]">Occasional fragrance launches, offers and news. Optional.</span></span>
          </label>
        )}

        {otpSent && (
          <label className="block text-sm">8-digit OTP
            <input required inputMode="numeric" pattern="[0-9]{8}" maxLength={8} value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 8))} className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3 text-center text-xl tracking-[0.24em] outline-none focus:ring-2 focus:ring-amber-600" />
          </label>
        )}

        <button disabled={loading} className="w-full rounded-lg bg-amber-600 py-2.5 text-white hover:bg-amber-700 disabled:opacity-60">
          {loading ? "Please wait…" : mode === "forgot" ? "Send reset link" : otpSent ? (isSignup ? "Verify & create account" : "Verify & login") : isSignup ? "Send signup OTP" : loginMethod === "otp" ? "Send login OTP" : "Login"}
        </button>

        <div className="text-center">
          {mode === "forgot" ? (
            <button type="button" onClick={() => { setMode("login"); setLoginMethod("password"); resetOtp(); }} className="font-medium text-amber-600">Back to login</button>
          ) : (
            <button type="button" onClick={() => { setMode(isLogin ? "signup" : "login"); setLoginMethod("password"); resetOtp(); }} className="font-medium text-amber-600">
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
