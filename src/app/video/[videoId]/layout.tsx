import { ReactNode } from "react";

export default function VideoLayout({ children }: { children: ReactNode }) {
  return <main className="w-full grow">{children}</main>;
}
