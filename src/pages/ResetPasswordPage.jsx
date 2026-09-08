import React, { useState } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function ResetPasswordPage({ setCurrentPage }) {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Please use at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await updatePassword(password);
      setSuccess(true);
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err?.message || "We couldn't update your password. Please request a new reset link and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl md:text-3xl font-semibold text-center">Choose a New Password</h1>
      <p className="mt-3 text-center text-sm text-[var(--color-muted)]">Use a password you don’t use on another website.</p>

      {error && <div role="alert" className="mt-6 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"><AlertCircle className="h-5 w-5 shrink-0" /><p className="text-sm">{error}</p></div>}
      {success ? (
        <div className="mt-8 text-center">
          <div role="status" className="flex gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-left text-green-800"><CheckCircle2 className="h-5 w-5 shrink-0" /><p className="text-sm">Your password has been updated successfully.</p></div>
          <button type="button" onClick={() => setCurrentPage?.("orders")} className="mt-6 w-full rounded-lg bg-amber-600 py-2.5 text-white hover:bg-amber-700">Continue to My Orders</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="new-password" className="text-sm">New Password</label>
            <div className="relative mt-1">
              <input id="new-password" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 pr-11 focus:outline-none focus:ring-2 focus:ring-amber-600" />
              <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute inset-y-0 right-2 flex min-h-11 items-center px-1 text-[var(--color-muted)]" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
            </div>
          </div>
          <div>
            <label htmlFor="confirm-password" className="text-sm">Confirm New Password</label>
            <input id="confirm-password" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-600" />
          </div>
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-amber-600 py-2.5 text-white hover:bg-amber-700 disabled:opacity-60">{loading ? "Updating…" : "Update Password"}</button>
        </form>
      )}
    </section>
  );
}
