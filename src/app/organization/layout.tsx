import { ReactNode } from "react";

// Per-visitor: rendered on request, without a static shell of its own.
export const instant = false;

// The organisation pages bring their own width: the studio bar above them runs
// edge to edge, so this only provides the page's one main landmark.
export default function Layout({ children }: { children: ReactNode }) {
  return <main className="flex w-full grow flex-col items-center">{children}</main>;
}
