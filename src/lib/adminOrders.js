import { supabase } from "./supabase";

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Your session has expired. Please log in again.");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  };
}

async function parseResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || "Request failed");
  return payload;
}

export async function fetchAdminOrders() {
  const response = await fetch("/api/admin/orders", {
    method: "GET",
    headers: await authHeaders(),
    cache: "no-store",
  });
  const payload = await parseResponse(response);
  return payload.orders || [];
}

export async function updateAdminOrder(orderId, values) {
  const response = await fetch("/api/admin/orders/update", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ order_id: orderId, ...values }),
  });
  const payload = await parseResponse(response);
  return payload.order;
}
