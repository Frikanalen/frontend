import { ReactNode } from "react";

/**
 * No card of its own. The page composes several — header, organizations,
 * sign-out — and a single wrapper card around the lot flattened exactly the
 * separations those sections are for.
 */
export default function Layout({ children }: { children: ReactNode }) {
  return <main className="w-full max-w-5xl px-2 pb-12">{children}</main>;
}
