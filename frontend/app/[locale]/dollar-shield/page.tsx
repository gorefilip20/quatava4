import type { Metadata } from "next";
import DollarShieldClient from "./client";

export const metadata: Metadata = {
  title: "Dollar Shield | Auto-DCA Protection",
  description:
    "Protect your money from inflation with automatic dollar-cost averaging into stablecoins.",
};

export default function DollarShieldPage() {
  return <DollarShieldClient />;
}
