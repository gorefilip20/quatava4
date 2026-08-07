import type { Metadata } from "next";
import AiInvestmentClient from "./client";

export const metadata: Metadata = {
  title: "AI Investment | Automated Trading",
  description:
    "Automated trading strategies powered by machine learning. Configure AI bots to trade on your behalf.",
};

export default function AiInvestmentPage() {
  return <AiInvestmentClient />;
}
