import type { Metadata } from "next";
import SavingsClient from "./client";

export const metadata: Metadata = {
  title: "Savings Vaults | Earn Yield on Stablecoins",
  description:
    "Earn up to 12% APY on your stablecoins with Quatava savings vaults.",
};

export default function SavingsPage() {
  return <SavingsClient />;
}
