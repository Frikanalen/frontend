"use client";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { NavbarItem } from "@heroui/react";
import Link from "next/link";

export const NavLink = ({
  href,
  activeRegexp,
  children,
}: {
  href: string;
  /**
   * In case you want to match isActive-ness more flexibly than href, pass a regexp here.
   * The button will show active state if current path matches it.
   */
  activeRegexp?: RegExp;
  children: ReactNode;
}) => {
  const path = usePathname();

  const isActive = !activeRegexp ? href === path : activeRegexp.test(path);
  return (
    <NavbarItem isActive={isActive}>
      <Link href={href}>{children}</Link>
    </NavbarItem>
  );
};
