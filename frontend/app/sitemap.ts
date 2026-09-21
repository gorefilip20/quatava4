import type { MetadataRoute } from "next";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://getquatava.com").replace(
  /\/$/,
  ""
);
const locales = ["en", "ar"];
const publicPaths = [
  "",
  "/market",
  "/trade?symbol=BTCUSDT",
  "/register",
  "/login",
  "/send-money",
  "/finance/dollar-shield",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return locales.flatMap((locale) =>
    publicPaths.map((path) => ({
      url: `${siteUrl}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: path === "" || path === "/market" ? "daily" : "weekly",
      priority: path === "" ? 1 : path === "/market" ? 0.8 : 0.6,
    }))
  );
}
