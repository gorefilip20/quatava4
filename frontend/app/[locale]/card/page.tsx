import type { Metadata } from "next";
import CardClient from "./client";

export const metadata: Metadata = {
  title: "Quatava Card | Virtual USD Card",
  description:
    "Spend crypto as dollars anywhere in the world with your Quatava virtual debit card.",
};

export default function CardPage() {
  return <CardClient />;
}
