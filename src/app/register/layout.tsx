import React from "react";

// Per-visitor: rendered on request, without a static shell of its own.
export const instant = false;

const Layout = ({ children }: { children: React.ReactNode }) => (
  <main className={"mx-4 mt-10 w-[calc(100%-2rem)] max-w-3xl bg-background p-6 sm:p-8"}>
    {children}
  </main>
);

export default Layout;
