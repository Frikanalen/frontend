import { ReactNode } from "react";
import cx from "classnames";

export const ModalIshPrototype = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <main className={cx("grow max-w-3xl w-full px-2 lg:py-12 flex flex-col", className)}>
    <section className="bg-background text-foreground rounded-xl border-1 border-primary-200 p-8 min-h-72">
      {children}
    </section>
  </main>
);

export const ModalIshPrototypeBody = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <section
    className={cx(
      "lg:aspect-video bg-background text-foreground rounded-xl border-1 border-primary-200 p-8 min-h-72",
      className,
    )}
  >
    {children}
  </section>
);
