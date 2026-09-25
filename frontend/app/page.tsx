// The middleware internally rewrites `/` to the default locale page so the
// browser stays on the bare domain. This lightweight fallback is retained for
// prerender/build compatibility if middleware is bypassed.
// eslint-disable-next-line no-restricted-imports
import { redirect } from "next/navigation";

export default function RootPage(): never {
  redirect("/en");
}
