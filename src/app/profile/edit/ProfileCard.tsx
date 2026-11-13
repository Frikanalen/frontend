import { ReactNode } from "react";

/** One task on the edit page: a heading, a line on what it is for, the form. */
export const ProfileCard = ({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: ReactNode;
  children: ReactNode;
}) => (
  <section aria-labelledby={id} className="bg-background rounded-xl p-6 shadow-lg">
    <h2 id={id} className="text-xl font-bold">
      {title}
    </h2>
    <p className="text-foreground/75 mt-1 mb-5 text-sm">{description}</p>
    {children}
  </section>
);
