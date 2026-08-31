import type { Metadata } from "next";
import LoansClient from "./client";

export const metadata: Metadata = {
  title: "Crypto Loans | Borrow Against Your Crypto",
  description:
    "Borrow against your crypto — no credit check, no selling. Get instant liquidity with competitive rates.",
};

export default function LoansPage() {
  return <LoansClient />;
}
