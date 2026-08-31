import type { Metadata } from "next";
import MerchantClient from "./client";

export const metadata: Metadata = {
  title: "Merchant Gateway | Quatava",
  description: "Accept crypto payments — customers pay crypto, you receive local currency.",
};

export default function MerchantPage() {
  return <MerchantClient />;
}
