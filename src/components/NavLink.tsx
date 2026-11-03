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
      isActive ? "text-foreground font-semibold" : "text-foreground/75 hover:text-foreground"
    }
  >
    {children}
  </Link>
);
