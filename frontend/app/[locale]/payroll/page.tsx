import type { Metadata } from "next";
import PayrollClient from "./client";

export const metadata: Metadata = {
  title: "Crypto Payroll | Receive Salary in Stablecoins",
  description:
    "Receive your salary in stablecoins and protect your income from devaluation.",
};

export default function PayrollPage() {
  return <PayrollClient />;
}
