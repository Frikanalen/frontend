import { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return <main className="w-full max-w-7xl grow px-4 pt-10 sm:px-6">{children}</main>;
}
