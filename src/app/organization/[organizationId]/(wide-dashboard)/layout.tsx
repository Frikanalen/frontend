import { ReactNode } from "react";

// Per-visitor: rendered on request, without a static shell of its own.
export const instant = false;

// The working pages - the grants board and the grant editor - sit straight on
// the canvas at the full page width, lined up with the channel bar above.
// Their white blocks are the things being worked on.
export default function Layout({ children }: { children: ReactNode }) {
  return <div className="w-full max-w-7xl px-4 pt-8 text-foreground sm:px-6">{children}</div>;
}
