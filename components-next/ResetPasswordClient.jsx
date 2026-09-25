"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth";

export default function ResetPasswordClient() {
  const router = useRouter();
  const { updatePassword, logout } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const code = params.get("error_code");
    const description = params.get("error_description");
    if (!code && !description) return;
    if (code === "otp_expired") {
      setLinkError("This password reset link is invalid or has expired. Please request a new reset link.");
    } else {
      setLinkError(description ? decodeURIComponent(description.replace(/\+/g, " ")) : "This password reset link is invalid. Please request a new reset link.");
    }
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (password.length < 8) return setError("Please use at least 8 characters.");
    if (password !== confirmPassword) return setError("The passwords do not match.");

    setLoading(true);
    try {
      await updatePassword(password);
      await logout();
      router.push("/login?message=" + encodeURIComponent("Password updated successfully. Please sign in with your new password."));
      router.refresh();
    } catch (err) {
      setError(err?.message || "We couldn't update your password. Please request a new reset link and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-md px-5 py-14 sm:px-8 md:py-20">
      <p className="text-center text-[9px] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">Account security</p>
      <h1 className="mt-4 text-center font-serif text-4xl font-normal">Choose a new password</h1>
      <p className="mt-3 text-center text-sm text-[var(--color-muted)]">Use a password you don't use on another website.</p>

      {(linkError || error) && <div role="alert" className="mt-6 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"><AlertCircle className="h-5 w-5 shrink-0" /><p className="text-sm">{linkError || error}</p></div>}

      {linkError ? (
        <Link href="/login" className="mt-6 block w-full rounded-lg bg-amber-600 py-2.5 text-center text-white hover:bg-amber-700">Request a new reset link</Link>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="text-sm">New password</label>
            <div className="relative mt-1">
              <input required minLength={8} type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 pr-11 outline-none focus:ring-2 focus:ring-amber-600" />
              <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute inset-y-0 right-2 flex items-center px-1 text-[var(--color-muted)]">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
            </div>
          </div>
          <label className="block text-sm">Confirm new password
            <input required minLength={8} type={showPassword ? "text" : "password"} autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 outline-none focus:ring-2 focus:ring-amber-600" />
          </label>
          <button disabled={loading} className="w-full rounded-lg bg-amber-600 py-2.5 text-white hover:bg-amber-700 disabled:opacity-60">{loading ? "Updating…" : "Update password"}</button>
        </form>
      )}
    </section>
  );
}
