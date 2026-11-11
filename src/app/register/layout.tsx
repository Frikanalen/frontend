import React from "react";

const Layout = ({ children }: { children: React.ReactNode }) => (
  <main className={"mx-4 mt-10 w-[calc(100%-2rem)] max-w-3xl bg-background p-6 sm:p-8"}>
    {children}
  </main>
);

export default Layout;
