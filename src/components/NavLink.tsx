import Link from "next/link";
import { ReactNode } from "react";

/** One section in the wide-screen navigation bar. */
export const NavLink = ({
  href,
  isActive,
  children,
}: {
  href: string;
  isActive: boolean;
  children: ReactNode;
}) => (
  <Link
    href={href}
    aria-current={isActive ? "page" : undefined}
    className={
      // The bar is the dark stage in both themes, so these are the stage's own
      // colours rather than the page's.
      isActive
        ? "border-b-2 border-brand-leaf py-2.5 font-semibold text-stage-foreground"
        : "border-b-2 border-transparent py-2.5 text-stage-muted hover:text-stage-foreground"
    }
  >
    {children}
  </Link>
);
