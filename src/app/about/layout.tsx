import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <main className="w-full max-w-5xl grow bg-background p-6 rounded-xl shadow-xl">
      {children}
    </main>
  );
}
