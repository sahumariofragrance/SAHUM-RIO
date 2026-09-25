import "../src/index.css";
import SiteShell from "../components-next/SiteShell";

export const metadata = {
  metadataBase: new URL("https://sahumario.com"),
  title: {
    default: "SAHUMäRIO® | Eau de Parfum in India",
    template: "%s | SAHUMäRIO®",
  },
  description: "Discover the SAHUMäRIO® Eau de Parfum collection and shop fragrances online across India.",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-IN" data-theme="dark" suppressHydrationWarning>
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
