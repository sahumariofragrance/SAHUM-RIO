import OrdersClient from "../../../../components-next/OrdersClient";

export const metadata = {
  title: "My Orders",
  robots: { index: false, follow: false },
};

export default function OrdersPage() {
  return <OrdersClient />;
}
