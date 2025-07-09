import React from "react";
import cx from "classnames";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <main
      className={cx(
        "bg-white/80 dark:bg-green-400/20 p-6 rounded-xl shadow-xl",
      )}
    >
      {children}
    </main>
  );
}
