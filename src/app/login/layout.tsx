import React from "react";
import cx from "classnames";
const Layout = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <main
    className={cx(
      "bg-white/80 dark:bg-green-400/20 p-6 rounded-xl shadow-xl",
      className,
    )}
  >
    {children}
  </main>
);

export default Layout;
