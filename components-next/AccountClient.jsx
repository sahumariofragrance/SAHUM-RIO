"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, LogOut, Mail, Package, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth";

export default function AccountClient() {
  const router = useRouter();
  const { user, loading, logout, supabase } = useAuth();
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [newsletterLoading, setNewsletterLoading] = useState(true);
  const [newsletterSaving, setNewsletterSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user || user.is_anonymous) {
      router.replace("/login");
      return;
    }

    let live = true;
    supabase.from("profiles").select("newsletter_subscribed").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (!live) return;
      setNewsletterSubscribed(Boolean(data?.newsletter_subscribed));
      setNewsletterLoading(false);
    });
    return () => { live = false; };
  }, [loading, user, router, supabase]);

  if (loading || !user || user.is_anonymous) return <div className="mx-auto max-w-3xl px-5 py-20"><div className="h-40 animate-pulse rounded-2xl bg-[var(--color-surface-muted)]" /></div>;

  async function updateNewsletter(nextValue) {
    setNewsletterSaving(true);
    setMessage("");
    const { error } = await supabase.from("profiles").update({
      newsletter_subscribed: nextValue,
      newsletter_consent_at: nextValue ? new Date().toISOString() : null,
      newsletter_source: nextValue ? "account_settings" : null,
      updated_at: new Date().toISOString(),
    }).eq("id", user.id);

    if (!error) {
      setNewsletterSubscribed(nextValue);
      setMessage(nextValue ? "Newsletter subscription enabled." : "Newsletter subscription turned off.");
    } else {
      setMessage("We could not update your newsletter preference. Please try again.");
    }
    setNewsletterSaving(false);
  }

  async function handleLogout() {
    await logout();
    router.push("/");
    router.refresh();
  }

  const name = user.user_metadata?.name || user.user_metadata?.full_name || "";

  return (
    <section className="mx-auto max-w-3xl px-5 py-14 sm:px-8 md:py-20">
      <div className="flex items-start justify-between gap-5">
        <div><p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">Customer account</p><h1 className="mt-3 font-serif text-5xl font-normal">My account</h1></div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-[var(--color-muted)] hover:text-red-500"><LogOut className="h-4 w-4" />Log out</button>
      </div>

      <div className="glass-soft mt-8 overflow-hidden rounded-2xl">
        <div className="border-b border-[var(--color-border)] p-5"><div className="flex items-center gap-3"><User className="h-5 w-5 text-amber-600" /><div><div className="text-xs text-[var(--color-muted)]">Name</div><div className="font-medium">{name || "Not provided"}</div></div></div></div>
        <div className="p-5"><div className="flex items-center gap-3"><Mail className="h-5 w-5 text-amber-600" /><div className="min-w-0"><div className="text-xs text-[var(--color-muted)]">Email</div><div className="truncate font-medium">{user.email}</div></div></div></div>
      </div>

      <div className="glass-soft mt-6 rounded-2xl p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-sm font-semibold">SAHUMäRIO newsletter</p><p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">Receive occasional fragrance launches, offers and SAHUMäRIO news.</p></div>
          <label className="inline-flex items-center gap-3"><input type="checkbox" checked={newsletterSubscribed} disabled={newsletterLoading || newsletterSaving} onChange={e => updateNewsletter(e.target.checked)} className="h-5 w-5" /><span className="text-sm font-medium">{newsletterSubscribed ? "Subscribed" : "Not subscribed"}</span></label>
        </div>
        {message && <p className="mt-4 flex items-center gap-2 text-sm text-[var(--color-muted)]">{message.startsWith("Newsletter") && <CheckCircle2 className="h-4 w-4 text-green-600" />}{message}</p>}
      </div>

      <Link href="/account/orders" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 font-medium text-white hover:bg-amber-700"><Package className="h-4 w-4" />View my orders</Link>
    </section>
  );
}
