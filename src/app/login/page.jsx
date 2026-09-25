import { Suspense } from "react";
import LoginClient from "../../../components-next/LoginClient";

export const metadata = {
  title: "Log In or Sign Up",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return <Suspense fallback={<div className="min-h-[50vh]" />}><LoginClient /></Suspense>;
}
