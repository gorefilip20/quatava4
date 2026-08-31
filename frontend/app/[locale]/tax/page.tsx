import type { Metadata } from "next";
import TaxClient from "./client";

export const metadata: Metadata = {
  title: "Tax Reports | Quatava",
  description: "One-click crypto tax reports compliant with your country's regulations.",
};

export default function TaxPage() {
  return <TaxClient />;
}
