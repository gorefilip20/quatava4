import type { Metadata } from "next";
import ReferralClient from "./client";

export const metadata: Metadata = {
  title: "Quatava Circle | Referral Rewards",
  description:
    "Invite friends, earn crypto — everyone wins. Share your unique referral link and earn rewards for every signup.",
};

export default function ReferralPage() {
  return <ReferralClient />;
}
