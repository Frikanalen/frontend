import { ReactNode } from "react";

// Per-visitor: rendered on request, without a static shell of its own.
export const instant = false;

/**
 * No card of its own. The page composes several — header, organizations,
 * sign-out — and a single wrapper card around the lot flattened exactly the
 * separations those sections are for.
 */
export default function Layout({ children }: { children: ReactNode }) {
  return <main className="w-full max-w-7xl grow px-4 pt-10 sm:px-6">{children}</main>;
}
