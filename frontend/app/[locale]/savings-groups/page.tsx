import type { Metadata } from "next";
import SavingsGroupsClient from "./client";

export const metadata: Metadata = {
  title: "Savings Circles | Quatava",
  description: "Traditional tandas modernized with stablecoins — save together, grow together.",
};

export default function SavingsGroupsPage() {
  return <SavingsGroupsClient />;
}
