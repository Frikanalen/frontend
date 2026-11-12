import { ReactNode } from "react";

/** The one heading every page in the section opens with, so they read as a set. */
export const AboutHeading = ({ children, lead }: { children: ReactNode; lead?: ReactNode }) => (
  <header className="max-w-3xl">
    <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{children}</h1>
    {lead ? <p className="mt-4 text-xl text-default-700">{lead}</p> : null}
  </header>
);
