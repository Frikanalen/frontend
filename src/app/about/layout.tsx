import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  // No surface of its own: the prose sits straight on the page canvas and the
  // brand glow behind it, as the front page and the archive now do. The padding
  // the box used to carry stays, so the text keeps its inset from the edge.
  return <main className="w-full max-w-5xl p-2 py-8">{children}</main>;
}
