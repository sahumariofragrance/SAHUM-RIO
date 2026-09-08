import { supabase } from "./supabase";

export async function completeVerifiedOrder({ paymentResponse, items, address }) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Your session expired after payment. Please contact support with your payment ID.");
  const response = await fetch("/api/orders/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({
      razorpay_order_id: paymentResponse.razorpay_order_id,
      razorpay_payment_id: paymentResponse.razorpay_payment_id,
      razorpay_signature: paymentResponse.razorpay_signature,
      items: items.map((item) => ({ product_id: item.product_id, qty: item.qty })),
      address,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || "Payment succeeded but we could not save your order. Please contact support with your payment ID.");
  return payload.order;
}
