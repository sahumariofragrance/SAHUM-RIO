import React, { useState } from "react";
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage({ setCurrentPage, redirectAfterLogin = "home" }) {
  const { login, signup, requestPasswordReset } = useAuth();
  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const isLogin = mode === "login";
  const isSignup = mode === "signup";

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const email = formData.email.trim();

    try {
      if (mode === "forgot") {
        await requestPasswordReset(email);
        setMessage("If an account exists for that email, a password reset link has been sent. Please check your inbox and spam folder.");
        return;
      }

      if (isLogin) {
        await login({ email, password: formData.password });
      } else {
        await signup({ name: formData.name.trim(), email, password: formData.password });
      }
      setCurrentPage?.(redirectAfterLogin);
    } catch (err) {
      setError(err?.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl md:text-3xl font-semibold text-center">
        {mode === "forgot" ? "Reset Password" : isLogin ? "Welcome Back" : "Create Account"}
      </h1>
      {mode === "forgot" && (
        <p className="mt-3 text-center text-sm text-[var(--color-muted)]">
          Enter your account email and we’ll send you a secure reset link.
        </p>
      )}

      {error && (
        <div role="alert" className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="text-sm">{error}</p>
        </div>
      )}
      {message && (
        <div role="status" className="mt-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="text-sm">{message}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {isSignup && (
          <div>
            <label htmlFor="auth-name" className="text-sm text-[var(--color-text)]">Full Name</label>
            <input id="auth-name" type="text" className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-600" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          </div>
        )}

        <div>
          <label htmlFor="auth-email" className="text-sm text-[var(--color-text)]">Email</label>
          <input id="auth-email" type="email" autoComplete="email" className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-600" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
        </div>

        {mode !== "forgot" && (
          <div>
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="auth-password" className="text-sm text-[var(--color-text)]">Password</label>
              {isLogin && (
                <button type="button" onClick={() => { setMode("forgot"); setError(null); setMessage(null); }} className="text-sm font-medium text-amber-600 hover:text-orange-600">
                  Forgot password?
                </button>
              )}
            </div>
            <div className="mt-1 relative">
              <input id="auth-password" type={showPassword ? "text" : "password"} autoComplete={isLogin ? "current-password" : "new-password"} minLength={6} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] px-3 py-2.5 pr-11 focus:outline-none focus:ring-2 focus:ring-amber-600" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
              <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute inset-y-0 right-2 flex min-h-11 items-center px-1 text-[var(--color-muted)] hover:text-amber-500" aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
        )}

        <button type="submit" disabled={loading} className="w-full rounded-lg bg-amber-600 text-white py-2.5 hover:bg-amber-700 transition-colors disabled:opacity-60">
          {loading ? "Please wait…" : mode === "forgot" ? "Send Reset Link" : isLogin ? "Login" : "Sign Up"}
        </button>

        <div className="text-center">
          {mode === "forgot" ? (
            <button type="button" onClick={() => { setMode("login"); setError(null); setMessage(null); }} className="text-amber-600 hover:text-orange-600 font-medium">Back to login</button>
          ) : (
            <button type="button" onClick={() => { setMode(isLogin ? "signup" : "login"); setError(null); setMessage(null); }} className="text-amber-600 hover:text-orange-600 font-medium">
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
