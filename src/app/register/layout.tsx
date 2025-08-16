import React from "react";

const Layout = ({ children }: { children: React.ReactNode }) => (
  <main
    className={
      "bg-background p-6 rounded-xl shadow-xl max-w-3xl border-primary-100 border-1 w-full"
    }
  >
    {children}
  </main>
);

export default Layout;
