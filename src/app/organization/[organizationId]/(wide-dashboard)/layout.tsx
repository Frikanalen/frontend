import { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="relative left-1/2 w-[calc(100vw-1rem)] max-w-7xl -translate-x-1/2 rounded-xl bg-background p-4 text-foreground shadow-lg">
      {children}
    </div>
  );
}
