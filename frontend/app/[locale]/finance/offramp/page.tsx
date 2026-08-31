import type { Metadata } from "next";
import OfframpClient from "./client";

export const metadata: Metadata = {
  title: "Instant Cash Out | Off-Ramp",
  description:
    "Convert crypto to local currency and receive funds straight to your bank in seconds.",
};

export default function OfframpPage() {
  return <OfframpClient />;
}
