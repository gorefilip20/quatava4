import type { Metadata } from "next";
import TransparencyClient from "./client";

export const metadata: Metadata = {
  title: "Transparency | Proof of Reserves",
  description:
    "Full visibility into Quatava's operations — trust through transparency. View proof of reserves, platform stats, and security certifications.",
};

export default function TransparencyPage() {
  return <TransparencyClient />;
}
