"use client";
import { Navbar, NavbarContent } from "@heroui/react";
import { Avatar } from "@heroui/react";
import { NavLink } from "@/components/NavLink";
import Link from "next/link";

export const HeaderNavMenu = ({ className }: { className?: string }) => (
  <Navbar className={className} isBlurred={false}>
    <NavbarContent>
      <NavLink href="/">Direkte</NavLink>
      <NavLink href="/schedule">Sendeplan</NavLink>
      <NavLink href="/about">Om oss</NavLink>
    </NavbarContent>
    <NavbarContent justify={"end"}>
      <Link href="/login">
        <Avatar showFallback />
      </Link>
    </NavbarContent>
  </Navbar>
);
