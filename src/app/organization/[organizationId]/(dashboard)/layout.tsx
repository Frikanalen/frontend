import { ReactNode } from "react";

// A flat white sheet on the paper canvas: no shadow, a hairline's worth of
// corner. Groups inside it are insets (bg-content1), never another sheet.
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-7xl px-4 pt-8 sm:px-6">
      <div className="bg-background p-4 text-foreground sm:p-6">{children}</div>
    </div>
  );
}
