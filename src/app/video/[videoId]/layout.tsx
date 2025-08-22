import { ReactNode } from "react";

export default function VideoLayout({ children }: { children: ReactNode }) {
  return <main className="w-full max-w-5xl grow px-2">{children}</main>;
}
