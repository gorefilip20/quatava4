import type { Metadata } from "next";
import InflationClient from "./client";

export const metadata: Metadata = {
  title: "Inflation Tracker | Protect Your Purchasing Power",
  description:
    "See how much you're saving by holding dollars. Track inflation rates across Latin America and protect your wealth.",
};

export default function InflationPage() {
  return <InflationClient />;
}
