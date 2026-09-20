import React, { useState } from "react";
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage({ setCurrentPage, redirectAfterLogin = "home", initialMessage = null }) {
  const { login, requestEmailOtp, verifyEmailOtp, requestPasswordReset } = useAuth();
  const [mode, setMode] = useState("login");
  const [loginMethod, setLoginMethod] = useState("password");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "", newsletterSubscribed: false });
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(initialMessage);

  const isLogin = mode === "login";
  const isSignup = mode === "signup";

  function resetOtp() {
    setOtpSent(false);
    setOtpCode("");
    setError(null);
    setMessage(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === "forgot") {
        await requestPasswordReset(formData.email);
        setMessage("If an account exists for that email, a password reset link has been sent. Please check your inbox and spam folder.");
        return;
      }

      if (isSignup) {
        if (!otpSent) {
          const email = await requestEmailOtp({
            email: formData.email,
            createUser: true,
            name: formData.name,
            newsletterSubscribed: formData.newsletterSubscribed,
          });
          setFormData((current) => ({ ...current, email }));
          setOtpSent(true);
          setMessage("We sent an 8-digit verification code to your email.");
        } else {
          await verifyEmailOtp({ email: formData.email, token: otpCode });
          setCurrentPage?.(redirectAfterLogin);
        }
        return;
      }

      if (loginMethod === "otp") {
        if (!otpSent) {
          const email = await requestEmailOtp({ email: formData.email, createUser: false });
          setFormData((current) => ({ ...current, email }));
          setOtpSent(true);
          setMessage("We sent an 8-digit login code to your email.");
        } else {
          await verifyEmailOtp({ email: formData.email, token: otpCode });
          setCurrentPage?.(redirectAfterLogin);
        }
        return;
      }

      await login({ email: formData.email, password: formData.password });
      setCurrentPage?.(redirectAfterLogin);
    } catch (err) {
      setError(err?.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-center text-2xl font-semibold md:text-3xl">
        {mode === "forgot" ? "Reset Password" : isLogin ? "Welcome Back" : "Create Account"}
      </h1>

      {isLogin && mode !== "forgot" && (
        <div className="mt-6 grid grid-cols-2 rounded-xl bg-[var(--color-surface-muted)] p-1">
          <button
            type="button"
            onClick={() => { setLoginMethod("password"); resetOtp(); }}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${loginMethod === "password" ? "bg-[var(--color-surface)] shadow-sm" : "text-[var(--color-muted)]"}`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => { setLoginMethod("otp"); resetOtp(); }}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${loginMethod === "otp" ? "bg-[var(--color-surface)] shadow-sm" : "text-[var(--color-muted)]"}`}
          >
            Email OTP
          </button>
        </div>
      )}

      {isSignup && (
        <p className="mt-3 text-center text-sm text-[var(--color-muted)]">
          Create your account securely with a one-time code sent to your email.
        </p>
      )}

      {mode === "forgot" && (
        <p className="mt-3 text-center text-sm text-[var(--color-muted)]">
          Enter your account email and we’ll send you a secure reset link.
        </p>
      )}

      {error && (
        <div role="alert" className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {message && (
        <div role="status" className="mt-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm">{message}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {isSignup && !otpSent && (
          <div>
            <label htmlFor="auth-name" className="text-sm text-[var(--color-text)]">Full Name</label>
            <input
              id="auth-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-600"
              required
            />
          </div>
        )}

        {!otpSent && (
          <div>
            <label htmlFor="auth-email" className="text-sm text-[var(--color-text)]">Email</label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-600"
              required
            />
          </div>
        )}

        {isLogin && loginMethod === "password" && mode !== "forgot" && (
          <div>
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="auth-password" className="text-sm text-[var(--color-text)]">Password</label>
              <button
                type="button"
                onClick={() => { setMode("forgot"); setError(null); setMessage(null); }}
                className="text-sm font-medium text-amber-600 hover:text-orange-600"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative mt-1">
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 pr-11 focus:outline-none focus:ring-2 focus:ring-amber-600"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-2 flex min-h-11 items-center px-1 text-[var(--color-muted)] hover:text-amber-500"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
        )}

        {isSignup && !otpSent && (
          <label className="flex items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
            <input
              type="checkbox"
              checked={formData.newsletterSubscribed}
              onChange={(e) => setFormData({ ...formData, newsletterSubscribed: e.target.checked })}
              className="mt-1 h-4 w-4 rounded border-[var(--color-border)] text-amber-600 focus:ring-amber-600"
            />
            <span>
              <span className="block text-sm font-medium">Keep me in the SAHUMäRIO loop</span>
              <span className="mt-1 block text-xs leading-5 text-[var(--color-muted)]">
                Send me occasional fragrance launches, offers, and SAHUMäRIO news. Optional.
              </span>
            </span>
          </label>
        )}

        {otpSent && (
          <>
            <div>
              <label htmlFor="otp-code" className="text-sm text-[var(--color-text)]">8-digit OTP</label>
              <input
                id="otp-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{8}"
                maxLength={8}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3 text-center text-xl tracking-[0.24em] focus:outline-none focus:ring-2 focus:ring-amber-600"
                required
              />
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <button type="button" onClick={resetOtp} className="font-medium text-[var(--color-muted)] hover:text-amber-600">
                Change email
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  setError(null);
                  setMessage(null);
                  try {
                    await requestEmailOtp({
                      email: formData.email,
                      createUser: isSignup,
                      name: formData.name,
                      newsletterSubscribed: formData.newsletterSubscribed,
                    });
                    setMessage("A new OTP has been sent.");
                  } catch (err) {
                    setError(err?.message || "Unable to resend OTP.");
                  } finally {
                    setLoading(false);
                  }
                }}
                className="font-medium text-amber-600 hover:text-orange-600 disabled:opacity-50"
              >
                Resend code
              </button>
            </div>
          </>
        )}

        <button type="submit" disabled={loading} className="w-full rounded-lg bg-amber-600 py-2.5 text-white transition-colors hover:bg-amber-700 disabled:opacity-60">
          {loading
            ? "Please wait…"
            : mode === "forgot"
              ? "Send Reset Link"
              : otpSent
                ? (isSignup ? "Verify & Create Account" : "Verify & Login")
                : isSignup
                  ? "Send signup OTP"
                  : loginMethod === "otp"
                    ? "Send login OTP"
                    : "Login"}
        </button>

        <div className="text-center">
          {mode === "forgot" ? (
            <button type="button" onClick={() => { setMode("login"); setLoginMethod("password"); resetOtp(); }} className="font-medium text-amber-600 hover:text-orange-600">
              Back to login
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMode(isLogin ? "signup" : "login");
                setLoginMethod("password");
                resetOtp();
              }}
              className="font-medium text-amber-600 hover:text-orange-600"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
