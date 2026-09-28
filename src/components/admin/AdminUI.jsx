import React from "react";

// Order workflow, in the order an order normally moves through it.
export const ORDER_FLOW = ["Pending", "Accepted", "Processing", "Shipped", "Delivered"];
export const ORDER_STATUSES = [...ORDER_FLOW, "Rejected", "Cancelled"];

export const STATUS_TONES = {
  Pending: "tone-amber",
  Accepted: "tone-sky",
  Processing: "tone-indigo",
  Shipped: "tone-violet",
  Delivered: "tone-green",
  Rejected: "tone-red",
  Cancelled: "tone-stone",
};

export function StatusPill({ status, className = "" }) {
  const value = status || "Pending";
  return (
    <span className={`admin-tone ${STATUS_TONES[value] || "tone-stone"} inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${className}`}>
      <span className={`admin-tone-dot ${STATUS_TONES[value] || "tone-stone"} h-1.5 w-1.5 rounded-full`} />
      {value}
    </span>
  );
}

export const inputClass =
  "w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-muted)]/70 focus:border-[var(--color-text)]/40 focus:ring-2 focus:ring-[var(--color-text)]/10 disabled:opacity-60";

export function Field({ label, hint, htmlFor, children, className = "" }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs leading-5 text-[var(--color-muted)]">{hint}</p>}
    </div>
  );
}

const BUTTON_VARIANTS = {
  primary: "bg-[var(--color-text)] text-[var(--color-bg)] hover:opacity-90",
  secondary: "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]",
  ghost: "text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]",
  danger: "border border-[var(--color-border)] bg-[var(--color-surface)] text-red-600 hover:border-red-400/60 hover:bg-red-500/5",
};

export function AdminButton({ variant = "secondary", size = "md", className = "", children, ...props }) {
  const sizes = { sm: "h-8 px-3 text-xs", md: "h-10 px-4 text-sm" };
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${sizes[size]} ${BUTTON_VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function StatTile({ label, value, sub, tone }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
        {tone && <span className={`admin-tone-dot ${tone} h-1.5 w-1.5 rounded-full`} />}
        {label}
      </div>
      <div className="mt-3 font-serif text-4xl leading-none tracking-[-0.02em]">{value}</div>
      {sub && <div className="mt-2 text-xs text-[var(--color-muted)]">{sub}</div>}
    </div>
  );
}

export function Notice({ tone = "stone", icon: Icon, children }) {
  return (
    <div className={`admin-tone tone-${tone} flex items-start gap-2 rounded-xl px-3.5 py-2.5 text-sm`}>
      {Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0" />}
      <div className="min-w-0">{children}</div>
    </div>
  );
}
