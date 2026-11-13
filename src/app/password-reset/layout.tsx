import type { Metadata } from "next";
import type { ReactNode } from "react";

// Per-visitor: rendered on request, without a static shell of its own.
export const instant = false;

export const metadata: Metadata = {
  title: "Nytt passord",
  // The reset link carries its token in the path; keep it out of the
  // Referer header of anything the page loads or links to.
  referrer: "no-referrer",
};

export default function PasswordResetLayout({ children }: { children: ReactNode }) {
  return (
    <section className={"mx-4 mt-10 w-[calc(100%-2rem)] max-w-xl bg-background p-6 sm:p-8"}>
      {children}
    </section>
  );
}
