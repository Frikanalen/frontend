import { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return <div className="bg-background text-foreground rounded-xl shadow-lg p-4">{children}</div>;
}
