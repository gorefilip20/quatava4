// The root route must use native redirect during prerendering to avoid the workStore bug.
// eslint-disable-next-line no-restricted-imports
import { redirect } from "next/navigation";

// Root page that redirects to default locale
export default function RootPage() {
  // Keep the bare domain as the canonical entry point for the English landing page.
  redirect("/en");
}
