import React from "react";
import { Mail, Package, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function AccountPage({ setCurrentPage }) {
  const { user } = useAuth();
  if (!user) return null;
  const name = user.user_metadata?.name || "";
  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold">My Account</h1>
      <p className="mt-2 text-[var(--color-muted)]">Manage your SAHUMäRIO account and access your orders.</p>
      <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="border-b border-[var(--color-border)] p-5">
          <div className="flex items-center gap-3"><User className="h-5 w-5 text-amber-600" /><div><div className="text-xs text-[var(--color-muted)]">Name</div><div className="font-medium">{name || "Not provided"}</div></div></div>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-3"><Mail className="h-5 w-5 text-amber-600" /><div className="min-w-0"><div className="text-xs text-[var(--color-muted)]">Email</div><div className="truncate font-medium">{user.email}</div></div></div>
        </div>
      </div>
      <button onClick={() => setCurrentPage?.("orders")} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 font-medium text-white hover:bg-amber-700"><Package className="h-4 w-4" />View My Orders</button>
    </section>
  );
}
