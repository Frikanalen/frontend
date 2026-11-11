import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  // No surface of its own: the prose sits straight on the paper canvas, as the
  // front page and the archive do.
  return <main className="w-full max-w-7xl grow px-4 pt-10 sm:px-6">{children}</main>;
}
