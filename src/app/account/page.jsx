import AccountClient from "../../../components-next/AccountClient";

export const metadata = {
  title: "My Account",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return <AccountClient />;
}
