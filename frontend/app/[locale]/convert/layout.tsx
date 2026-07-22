"use client";

import type { ReactNode } from "react";
import SiteHeader from "@/components/partials/header/site-header";
import Footer from "@/components/partials/footer";

const convertMenu = [
  {
    key: "convert",
    title: "Convert",
    href: "/convert",
    icon: "lucide:refresh-cw",
  },
  {
    key: "wallet",
    title: "Wallet",
    href: "/finance/wallet",
    icon: "lucide:wallet",
  },
  {
    key: "trade",
    title: "Trade",
    href: "/trade",
    icon: "lucide:bar-chart-2",
  },
];

export default function ConvertLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <SiteHeader menu={convertMenu} />
      <div className="container mx-auto px-4 pt-24 pb-18 min-h-[calc(100vh-56px)]">
        <main>{children}</main>
      </div>
      <Footer />
    </div>
  );
}
