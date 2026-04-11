import React, { useState } from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { useRouter } from "../router";
import { useAuth } from "../context/AuthContext";

export default function LoginPage({ redirectPath = "/" }) {
  const { navigate } = useRouter();
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        await login({ email: formData.email.trim(), password: formData.password });
      } else {
        await signup({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
        });
      }
      navigate(redirectPath);
    } catch (err) {
      setError((err && err.message) || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-md px-4 py-12">
      <h3 className="text-2xl md:text-3xl font-semibold text-center">
        {isLogin ? "Welcome Back" : "Create Account"}
      </h3>

      {error && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {!isLogin && (
          <div>
            <label className="text-sm text-[var(--color-text)]">Full Name</label>
            <input
              type="text"
              className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-600 placeholder:text-[var(--color-muted)]"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
        )}

        <div>
          <label className="text-sm text-[var(--color-text)]">Email</label>
          <input
            type="email"
            className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-600 placeholder:text-[var(--color-muted)]"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="text-sm text-[var(--color-text)]">Password</label>
          <div className="mt-1 relative">
            <input
              type={showPassword ? "text" : "password"}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-amber-600 placeholder:text-[var(--color-muted)]"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute inset-y-0 right-2 flex items-center text-[var(--color-muted)] hover:text-amber-500"
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-amber-600 text-white py-2.5 hover:bg-amber-700 active:scale-95 transition-colors disabled:opacity-60"
        >
          {loading ? (isLogin ? "Logging in…" : "Signing up…") : isLogin ? "Login" : "Sign Up"}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin((v) => !v);
              setError(null);
            }}
            className="text-amber-600 hover:text-orange-600 font-medium"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
          </button>
        </div>
      </form>
    </section>
  );
}
