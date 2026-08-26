import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";

// Get default locale from environment variable or fallback to "en"
const defaultLocale = process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE || "en";

// Handle multi-line environment variable with proper parsing
const languagesString = process.env.NEXT_PUBLIC_LANGUAGES || "";
const parsedLocales = languagesString
  .split(/[,\n\r]+/)
  .map((code) => code.trim())
  .filter((code) => code.length > 0);
const locales = Array.from(new Set(parsedLocales.length ? parsedLocales : [defaultLocale, "ar"]));

export const routing = defineRouting({
  locales: locales,
  defaultLocale: defaultLocale,
  localePrefix: "always", // Always use locale prefix for consistency
  localeDetection: true, // Enable automatic locale detection
});

export const { Link, usePathname, useRouter, redirect } = createNavigation(routing);
