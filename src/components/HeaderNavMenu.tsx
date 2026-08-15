"use client";
import { Navbar, NavbarContent } from "@heroui/react";
import { Avatar } from "@heroui/react";
import { NavLink } from "@/components/NavLink";
import Link from "next/link";
import { User } from "@/generated/frikanalenDjangoAPI.schemas";

export const HeaderNavMenu = ({
  className,
  user,
}: {
  className?: string;
  user: User | null;
}) => {
  return (
    <Navbar className={className} isBlurred={false}>
      <NavbarContent>
        <NavLink href="/">Direkte</NavLink>
        <NavLink href="/schedule" activeRegexp={new RegExp("/schedule.*")}>
          Sendeplan
        </NavLink>
        <NavLink href="/about" activeRegexp={new RegExp("/about.*")}>
          Om oss
        </NavLink>
      </NavbarContent>
      <NavbarContent justify={"end"}>
        {user ? (
          <Link href={"/profile"}>{user.firstName}</Link>
        ) : (
          <Link href="/login">
            <Avatar className={"text-default-foreground"} showFallback />
          </Link>
        )}
      </NavbarContent>
    </Navbar>
  );
};
