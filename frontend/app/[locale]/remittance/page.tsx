import type { Metadata } from "next";
import RemittanceClient from "./client";

export const metadata: Metadata = {
  title: "Send Money | Cross-Border Remittances",
  description:
    "Send money across Latin America at near-zero cost with instant crypto-powered transfers.",
};

export default function RemittancePage() {
  return <RemittanceClient />;
}
