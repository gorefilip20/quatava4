import type { MetadataRoute } from "next";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://getquatava.com").replace(
  /\/$/,
  ""
);
const defaultLocale = "en";
const secondaryLocales = ["ar"];
const publicPaths = [
  "",
  "/market",
  "/trade?symbol=BTCUSDT",
  "/register",
  "/login",
  "/send-money",
  "/finance/dollar-shield",
  "/platform",
  "/business",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const defaultEntries = publicPaths.map((path) => ({
    url: `${siteUrl}${path || "/"}`,
    lastModified: new Date(),
    changeFrequency: path === "" || path === "/market" ? "daily" as const : "weekly" as const,
    priority: path === "" ? 1 : path === "/market" ? 0.8 : 0.6,
  }));

  const localizedEntries = secondaryLocales.flatMap((locale) =>
    publicPaths.map((path) => ({
      url: `${siteUrl}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: path === "" || path === "/market" ? "daily" as const : "weekly" as const,
      priority: path === "" ? 0.8 : path === "/market" ? 0.7 : 0.5,
    }))
  );

  return [...defaultEntries, ...localizedEntries];
}
