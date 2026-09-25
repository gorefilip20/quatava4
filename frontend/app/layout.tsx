import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://getquatava.com"
  ),
  applicationName: "Quatava",
  title: {
    default: "Quatava — Crypto, all day. One clear terminal.",
    template: "%s | Quatava",
  },
  description:
    "Quatava is a focused crypto terminal for markets, spot trading, earn products, and multi-chain money movement.",
  manifest: "/manifest.json",
  icons: { icon: "/favicon.ico", shortcut: "/favicon.ico" },
  appleWebApp: {
    capable: true,
    title: "Quatava",
    statusBarStyle: "default",
  },
  openGraph: {
    type: "website",
    siteName: "Quatava",
    title: "Quatava — Crypto, all day. One clear terminal.",
    description:
      "A focused crypto terminal for markets, trading, earn, and multi-chain money movement.",
    url: "https://getquatava.com",
  },
  twitter: {
    card: "summary",
    title: "Quatava — Crypto, all day. One clear terminal.",
    description:
      "A focused crypto terminal for markets, trading, earn, and multi-chain money movement.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "Quatava",
        url: "https://getquatava.com",
        logo: "https://getquatava.com/images/logo/logo.svg",
      },
      {
        "@type": "WebSite",
        name: "Quatava",
        url: "https://getquatava.com",
        description:
          "A focused crypto terminal for markets, trading, earn, and multi-chain money movement.",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {children}
    </>
  );
}
