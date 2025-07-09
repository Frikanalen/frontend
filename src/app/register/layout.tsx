import React from "react";

const Layout = ({ children }: { children: React.ReactNode }) => (
  <main className={"bg-white/80 dark:bg-green-400/20 p-6 rounded-xl shadow-xl"}>
    {children}
  </main>
);

export default Layout;
