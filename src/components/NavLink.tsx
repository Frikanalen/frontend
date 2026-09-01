"use client";
import { ReactNode } from "react";
import { NavbarItem } from "@heroui/react";
import Link from "next/link";

/**
 * One section in the wide-screen bar.
 *
 * The narrow-screen menu draws its own rows rather than reusing this one: a
 * bar item is a word in a horizontal strip, a menu row is a full-width target
 * you can hit with a thumb, and the two want different padding, size and
 * active treatment. What they must share is *which* section is current, so
 * that is decided once by the caller and handed to both.
 */
export const NavLink = ({
  href,
  isActive,
  children,
}: {
  href: string;
  isActive: boolean;
  children: ReactNode;
}) => (
  <NavbarItem isActive={isActive}>
    <Link href={href} aria-current={isActive ? "page" : undefined}>
      {children}
    </Link>
  </NavbarItem>
);
