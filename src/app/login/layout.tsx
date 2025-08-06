import React from "react";

const Layout = ({ children }: { children: React.ReactNode }) => (
  <main className={"bg-background p-6 rounded-xl shadow-xl"}>{children}</main>
);

export default Layout;
