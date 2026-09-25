import BulkOrdersClient from "../../components-next/BulkOrdersClient";

export const metadata = {
  title: "Bulk Perfume Orders & Corporate Gifting",
  description: "Enquire about SAHUMäRIO® bulk fragrance orders and corporate gifting in India.",
  alternates: { canonical: "/bulk-orders" },
};

export default function BulkOrdersPage() {
  return <BulkOrdersClient />;
}
