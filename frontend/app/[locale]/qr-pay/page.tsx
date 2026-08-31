import type { Metadata } from "next";
import QrPayClient from "./client";

export const metadata: Metadata = {
  title: "QR Pay | Pay & Receive with Crypto",
  description:
    "Pay anywhere with crypto using QR codes. Merchants receive local currency instantly.",
};

export default function QrPayPage() {
  return <QrPayClient />;
}
