import React, { useEffect, useState } from "react";
import { CheckCircle2, Mail, Package, Phone, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

export default function AccountPage({ setCurrentPage }) {
  const { user, requestPhoneVerification, verifyPhoneVerification } = useAuth();
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [newsletterLoading, setNewsletterLoading] = useState(true);
  const [newsletterSaving, setNewsletterSaving] = useState(false);
  const [newsletterMessage, setNewsletterMessage] = useState("");
  const [phone, setPhone] = useState(user?.phone || "");
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [phoneMessage, setPhoneMessage] = useState("");

  useEffect(() => {
    let live = true;
    if (!user?.id) return () => { live = false; };

    supabase
      .from("profiles")
      .select("newsletter_subscribed,phone")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!live) return;
        setNewsletterSubscribed(Boolean(data?.newsletter_subscribed));
        setPhone(user?.phone || data?.phone || "");
        setNewsletterLoading(false);
      });

    return () => { live = false; };
  }, [user?.id, user?.phone]);

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

  async function sendPhoneOtp() {
    setPhoneSaving(true);
    setPhoneMessage("");
    try {
      const normalized = await requestPhoneVerification(phone);
      setPhone(normalized);
      setPhoneOtpSent(true);
      setPhoneMessage("We sent a verification code to your phone.");
    } catch (err) {
      setPhoneMessage(err?.message || "Unable to send phone verification code.");
    } finally {
      setPhoneSaving(false);
    }
  }

  async function verifyPhoneOtp() {
    setPhoneSaving(true);
    setPhoneMessage("");
    try {
      const normalized = await verifyPhoneVerification({ phone, token: phoneCode });
      setPhone(normalized);
      setPhoneOtpSent(false);
      setPhoneCode("");
      setPhoneMessage("Phone number verified. You can now use it for OTP login.");
    } catch (err) {
      setPhoneMessage(err?.message || "Unable to verify phone number.");
    } finally {
      setPhoneSaving(false);
    }
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
        <div className="flex items-start gap-3">
          <Phone className="mt-0.5 h-5 w-5 text-amber-600" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Phone OTP login</p>
            <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
              Verify a mobile number once, then you can sign in using an SMS OTP.
            </p>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setPhoneOtpSent(false); setPhoneCode(""); setPhoneMessage(""); }}
                placeholder="+91 98765 43210"
                className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-600"
                disabled={phoneSaving || Boolean(user.phone)}
              />
              {!user.phone && !phoneOtpSent && (
                <button
                  type="button"
                  onClick={sendPhoneOtp}
                  disabled={phoneSaving || !phone.trim()}
                  className="rounded-lg bg-[#24160f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-800 disabled:opacity-50"
                >
                  {phoneSaving ? "Sending…" : "Send code"}
                </button>
              )}
            </div>

            {user.phone && (
              <p className="mt-3 flex items-center gap-2 text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4" /> Verified for OTP login
              </p>
            )}

            {!user.phone && phoneOtpSent && (
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={phoneCode}
                  onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="6-digit OTP"
                  className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 text-center tracking-[0.25em] focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
                <button
                  type="button"
                  onClick={verifyPhoneOtp}
                  disabled={phoneSaving || phoneCode.length !== 6}
                  className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {phoneSaving ? "Verifying…" : "Verify phone"}
                </button>
              </div>
            )}

            {phoneMessage && <p className="mt-3 text-sm text-[var(--color-muted)]" role="status">{phoneMessage}</p>}
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
