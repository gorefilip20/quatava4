import type { Metadata } from "next";
import BillPayClient from "./client";

export const metadata: Metadata = {
  title: "Bill Pay | Pay Bills with Crypto",
  description:
    "Pay your utilities, phone, internet, and more with crypto across Latin America.",
};

export default function BillPayPage() {
  return <BillPayClient />;
}
