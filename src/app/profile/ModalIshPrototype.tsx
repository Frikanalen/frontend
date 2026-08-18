import { ReactNode } from "react";
import cx from "classnames";

/**
 * As you may be able to tell, I'm not sure what to name this -
 * it's a container component for single pages with not a lot of UI,
 * like user signup forms, etc. Positions and width-constrains the page;
 * the actual card is ModalIshPrototypeBody.
 */
export const ModalIshPrototype = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <main className={cx("grow max-w-3xl w-full px-2 lg:py-12 flex flex-col", className)}>
    {children}
  </main>
);

export const ModalIshPrototypeBody = ({
  children,
  className,
  aspectVideo = false,
}: {
  children: ReactNode;
  className?: string;
  /** Shapes the card like the video player it's standing in for. Off by default — most callers are forms. */
  aspectVideo?: boolean;
}) => (
  <section
    className={cx(
      // Echoes the header nav pill's rounded-xl/shadow-lg treatment rather than a bordered box.
      "bg-background text-foreground rounded-xl shadow-lg p-8 min-h-72",
      aspectVideo && "lg:aspect-video",
      className,
    )}
  >
    {children}
  </section>
);
