import { ReactNode } from "react";

export const ModalIshPrototype = ({ children }: { children: ReactNode }) => (
  <main className="grow max-w-3xl w-full p-8">
    <section className="bg-background rounded-xl border-1 border-primary-200 p-8">
      {children}
    </section>
  </main>
);