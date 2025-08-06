"use client";
import { Navbar, NavbarContent } from "@heroui/react";
import { Avatar } from "@heroui/react";
import { NavLink } from "@/components/NavLink";
import Link from "next/link";
import { useUserRetrieve } from "@/generated/user/user";
import { useEffect } from "react";

export const HeaderNavMenu = ({ className }: { className?: string }) => {
  const { data } = useUserRetrieve({
    query: {
      retry: false,
      throwOnError: (err) => (err?.response?.status ?? 0) >= 500,
    },
  });
  useEffect(() => console.log(data), [data]);
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
        {data ? (
          <Link href={"/profile"}>{data.data.firstName}</Link>
        ) : (
          <Link href="/login">
            <Avatar className={"text-default-foreground"} showFallback />
          </Link>
        )}
      </NavbarContent>
    </Navbar>
  );
};
