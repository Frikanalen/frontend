import { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <main className="w-full max-w-5xl h-fit px-2">
      <div className={"bg-background text-foreground rounded-xl shadow-lg p-4"}>{children}</div>
    </main>
  );
}
