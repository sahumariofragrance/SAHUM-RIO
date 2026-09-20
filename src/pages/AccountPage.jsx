import React, { useEffect, useState } from "react";
import { CheckCircle2, Mail, Package, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

export default function AccountPage({ setCurrentPage }) {
  const { user } = useAuth();
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [newsletterLoading, setNewsletterLoading] = useState(true);
  const [newsletterSaving, setNewsletterSaving] = useState(false);
  const [newsletterMessage, setNewsletterMessage] = useState("");

  useEffect(() => {
    let live = true;
    if (!user?.id) return () => { live = false; };

    supabase
      .from("profiles")
      .select("newsletter_subscribed")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!live) return;
        setNewsletterSubscribed(Boolean(data?.newsletter_subscribed));
        setNewsletterLoading(false);
      });

    return () => { live = false; };
  }, [user?.id]);

  if (!user) return null;

  const name = user.user_metadata?.name || "";

  async function updateNewsletter(nextValue) {
    setNewsletterSaving(true);
    setNewsletterMessage("");

    const { error } = await supabase
      .from("profiles")
      .update({
        newsletter_subscribed: nextValue,
        newsletter_consent_at: nextValue ? new Date().toISOString() : null,
        newsletter_source: nextValue ? "account_settings" : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (!error) {
      setNewsletterSubscribed(nextValue);
      setNewsletterMessage(nextValue ? "Newsletter subscription enabled." : "Newsletter subscription turned off.");
    } else {
      setNewsletterMessage("We could not update your newsletter preference. Please try again.");
    }

    setNewsletterSaving(false);
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold">My Account</h1>
      <p className="mt-2 text-[var(--color-muted)]">Manage your SAHUMäRIO account and access your orders.</p>

      <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="border-b border-[var(--color-border)] p-5">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-amber-600" />
            <div>
              <div className="text-xs text-[var(--color-muted)]">Name</div>
              <div className="font-medium">{name || "Not provided"}</div>
            </div>
          </div>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-amber-600" />
            <div className="min-w-0">
              <div className="text-xs text-[var(--color-muted)]">Email</div>
              <div className="truncate font-medium">{user.email}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <p className="text-sm font-semibold">SAHUMäRIO newsletter</p>
            <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
              Receive occasional fragrance launches, offers, and SAHUMäRIO news.
            </p>
          </div>

          <label className="inline-flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={newsletterSubscribed}
              disabled={newsletterLoading || newsletterSaving}
              onChange={(event) => updateNewsletter(event.target.checked)}
              className="h-5 w-5 rounded border-[var(--color-border)] text-amber-600 focus:ring-amber-600 disabled:opacity-50"
            />
            <span className="text-sm font-medium">
              {newsletterSubscribed ? "Subscribed" : "Not subscribed"}
            </span>
          </label>
        </div>

        {newsletterMessage && (
          <p className="mt-4 flex items-center gap-2 text-sm text-[var(--color-muted)]" role="status">
            {newsletterMessage.startsWith("Newsletter") && <CheckCircle2 className="h-4 w-4 text-green-600" />}
            {newsletterMessage}
          </p>
        )}
      </div>

      <button
        onClick={() => setCurrentPage?.("orders")}
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 font-medium text-white hover:bg-amber-700"
      >
        <Package className="h-4 w-4" />
        View My Orders
      </button>
    </section>
  );
}
