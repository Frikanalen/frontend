import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <main className="w-full max-w-5xl p-2">
      <div className="bg-background p-8 rounded-xl shadow-lg">{children}</div>
    </main>
  );
}
