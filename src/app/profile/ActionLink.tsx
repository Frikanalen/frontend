import Link from "next/link";
import cx from "classnames";
import { ReactNode } from "react";

/**
 * A link dressed as a button.
 *
 * Everything a user can do from this page is a navigation, and a navigation
 * belongs in an anchor: middle-click has to open it in a new tab, the status
 * bar has to show where it goes, and a screen reader has to call it a link
 * rather than a button. HeroUI's Button can render as an anchor, but only from
 * a client component — and the only thing on this page that genuinely needs to
 * be one is the sign-out button. So the sizing here mirrors HeroUI's `md`
 * button (h-10, px-4, text-small, rounded-xl) and the two read as one control
 * where they sit near each other.
 */
export const ActionLink = ({
  href,
  icon,
  variant = "quiet",
  className,
  children,
}: {
  href: string;
  icon?: ReactNode;
  /** `solid` marks the single action a card exists for. Everything else is quiet. */
  variant?: "solid" | "quiet";
  className?: string;
  children: ReactNode;
}) => (
  <Link
    href={href}
    className={cx(
      "inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm whitespace-nowrap",
      "outline-focus transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
      variant === "solid"
        ? "bg-primary text-primary-foreground font-medium hover:bg-primary-600"
        : "text-foreground/80 hover:bg-default-100 hover:text-foreground",
      className,
    )}
  >
    {/* Decoration: every one of these sits beside its own label. */}
    {icon && <span aria-hidden="true">{icon}</span>}
    {children}
  </Link>
);
