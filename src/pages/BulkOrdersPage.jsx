import React, { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const TERMS = [
  {
    title: "Minimum Order Value",
    text: "The minimum order value for bulk orders is ₹10,000. Enquiries below this amount will not be considered as bulk orders.",
  },
  {
    title: "Pricing & Discounts",
    text: "Preferential pricing may be offered depending on the quantity, product mix, and total order value. Final pricing and any applicable discount will be shared after we review your enquiry.",
  },
  {
    title: "Order Placement",
    text: "Bulk purchases begin with a formal enquiry through this page. After receiving your request, a SAHUMäRIO representative will contact you to confirm products, quantities, pricing, and the next steps.",
  },
  {
    title: "Delivery Period",
    text: "Once a bulk order is confirmed, we aim to deliver it within seven business days. Product availability, destination, courier conditions, or other operational factors may affect the timeline, and we will communicate any material delay.",
  },
  {
    title: "Shipping & Handling",
    text: "Shipping and handling charges are determined by the size and weight of the shipment and the delivery location. Any applicable charges will be communicated before the order is confirmed.",
  },
  {
    title: "Payment Requirements",
    text: "Bulk orders may be paid through bank transfer, cards, or another payment method agreed with SAHUMäRIO. Payment instructions will be included with the order confirmation, and full payment is required to confirm the order unless otherwise agreed in writing.",
  },
  {
    title: "Product Availability",
    text: "We aim to keep our catalogue available for bulk orders, but some products may occasionally be unavailable or discontinued. If that happens, we will contact you to discuss a suitable alternative or, where applicable, a refund for the unavailable item.",
  },
];

const initialForm = {
  name: "",
  company: "",
  email: "",
  phone: "",
  item_name: "",
  quantity: "",
  estimated_order_value: "",
  additional_information: "",
  accepted_terms: false,
  website: "",
};

export default function BulkOrdersPage() {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(null);

    try {
      const response = await fetch("/api/bulk-orders/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          quantity: Number(form.quantity),
          estimated_order_value: Number(form.estimated_order_value),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "Unable to submit your enquiry.");

      setSuccess(payload);
      setForm(initialForm);
    } catch (submitError) {
      setError(submitError?.message || "Unable to submit your enquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      <section className="overflow-hidden bg-[#24160f] text-[#fff8ed]">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
          <div className="grid gap-12 md:grid-cols-[1.15fr_0.85fr] md:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-300">Bulk orders · Corporate gifting</p>
              <h1 className="mt-5 max-w-4xl font-serif text-[clamp(3.6rem,8vw,7rem)] font-semibold leading-[0.86] tracking-[-0.045em]">
                Fragrance,
                <span className="block italic font-medium text-stone-300">at scale.</span>
              </h1>
            </div>
            <p className="max-w-xl text-sm leading-7 text-stone-300 md:text-base">
              Planning corporate gifts, celebrations, events, or a larger fragrance order? Tell us what you need and we’ll help shape the right order.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-4 py-14 md:px-6 md:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-amber-700">Enquiry form</p>
          <h2 className="mt-3 font-serif text-3xl font-semibold md:text-4xl">Tell us about your requirement.</h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--color-muted)]">
            Bulk enquiries start at ₹10,000. Share an estimated order value so we can route your request correctly.
          </p>

          {success ? (
            <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-6 text-green-900">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6" />
                <h3 className="font-serif text-2xl font-semibold">Enquiry received.</h3>
              </div>
              <p className="mt-3 text-sm leading-6">We’ll review your requirement and get in touch with you.</p>
              {success.reference && <p className="mt-2 font-mono text-xs">Reference: {success.reference}</p>}
              <button type="button" onClick={() => setSuccess(null)} className="mt-5 text-sm font-semibold underline underline-offset-4">
                Submit another enquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-medium">Name *
                  <input required maxLength={120} value={form.name} onChange={(e) => update("name", e.target.value)} className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 outline-none focus:ring-2 focus:ring-amber-500" placeholder="Your name" />
                </label>
                <label className="text-sm font-medium">Company <span className="font-normal text-[var(--color-muted)]">(optional)</span>
                  <input maxLength={160} value={form.company} onChange={(e) => update("company", e.target.value)} className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 outline-none focus:ring-2 focus:ring-amber-500" placeholder="Company or organisation" />
                </label>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-medium">Email *
                  <input required type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 outline-none focus:ring-2 focus:ring-amber-500" placeholder="you@example.com" />
                </label>
                <label className="text-sm font-medium">Phone *
                  <input required inputMode="tel" maxLength={30} value={form.phone} onChange={(e) => update("phone", e.target.value)} className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 outline-none focus:ring-2 focus:ring-amber-500" placeholder="+91 ..." />
                </label>
              </div>

              <label className="block text-sm font-medium">Product / requirement *
                <input required maxLength={300} value={form.item_name} onChange={(e) => update("item_name", e.target.value)} className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 outline-none focus:ring-2 focus:ring-amber-500" placeholder="Perfume names, gift requirement, assortment, etc." />
              </label>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-medium">Quantity *
                  <input required type="number" min="1" max="100000" value={form.quantity} onChange={(e) => update("quantity", e.target.value)} className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 outline-none focus:ring-2 focus:ring-amber-500" placeholder="No. of items" />
                </label>
                <label className="text-sm font-medium">Estimated order value (₹) *
                  <input required type="number" min="10000" step="1" value={form.estimated_order_value} onChange={(e) => update("estimated_order_value", e.target.value)} className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 outline-none focus:ring-2 focus:ring-amber-500" placeholder="Minimum 10000" />
                </label>
              </div>

              <label className="block text-sm font-medium">Additional information <span className="font-normal text-[var(--color-muted)]">(optional)</span>
                <textarea rows={6} maxLength={2000} value={form.additional_information} onChange={(e) => update("additional_information", e.target.value)} className="mt-2 w-full resize-y rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 leading-6 outline-none focus:ring-2 focus:ring-amber-500" placeholder="Delivery city, event date, packaging requirements, preferred fragrances, or anything else we should know." />
              </label>

              <div className="hidden" aria-hidden="true">
                <label>Website<input tabIndex="-1" autoComplete="off" value={form.website} onChange={(e) => update("website", e.target.value)} /></label>
              </div>

              <label className="flex items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 text-sm leading-6">
                <input type="checkbox" required checked={form.accepted_terms} onChange={(e) => update("accepted_terms", e.target.checked)} className="mt-1 h-4 w-4 rounded border-[var(--color-border)] text-amber-600 focus:ring-amber-500" />
                <span>I have read and agree to the bulk order terms and conditions shown on this page.</span>
              </label>

              {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

              <button disabled={submitting} type="submit" className="inline-flex items-center gap-2 rounded-full bg-[#24160f] px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-amber-800 disabled:opacity-50">
                {submitting ? "Submitting…" : "Submit enquiry"} <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[2rem] bg-[#24160f] p-6 text-[#fff8ed] md:p-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-300">Terms & conditions</p>
            <div className="mt-6 divide-y divide-white/10 border-y border-white/10">
              {TERMS.map((term, index) => (
                <div key={term.title} className="grid grid-cols-[2.5rem_1fr] gap-3 py-5">
                  <span className="pt-1 text-[10px] font-semibold tracking-[0.18em] text-amber-300">0{index + 1}</span>
                  <div>
                    <h3 className="font-serif text-xl font-semibold">{term.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-stone-300">{term.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-6 text-xs leading-5 text-stone-400">
              Submitting an enquiry does not by itself create a confirmed order. Final products, pricing, availability, shipping, and payment details are confirmed separately by SAHUMäRIO.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
