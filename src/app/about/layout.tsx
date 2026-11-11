import React from "react";
import { AboutNav } from "@/app/about/AboutNav";

export default function Layout({ children }: { children: React.ReactNode }) {
  // No surface of its own: the prose sits straight on the paper canvas, as the
  // front page and the archive do.
  return (
    <>
      <AboutNav />
      <main className="w-full max-w-7xl grow space-y-10 px-4 pt-10 sm:px-6">{children}</main>
    </>
  );
}
