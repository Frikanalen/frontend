"use client";

import { Avatar, Button } from "@heroui/react";
import { NavLink } from "@/components/NavLink";
import Link from "next/link";
import cx from "classnames";
import { usePathname } from "next/navigation";
import { User } from "@/generated/frikanalenDjangoAPI.schemas";
import { useState } from "react";
import { GoPersonFill } from "react-icons/go";

const SECTIONS = [
  { href: "/", label: "Direkte" },
  { href: "/video", label: "Arkiv", activeRegexp: /\/video.*/ },
  { href: "/schedule", label: "Sendeplan", activeRegexp: /\/schedule.*/ },
  { href: "/about", label: "Om oss", activeRegexp: /\/about.*/ },
  { href: "/about/join", label: "Bli med" },
];

export const HeaderNavMenu = ({ className, user }: { className?: string; user: User | null }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const path = usePathname();
  const activeHref = SECTIONS.filter(({ href, activeRegexp }) =>
    activeRegexp ? activeRegexp.test(path) : href === path,
  ).sort((a, b) => b.href.length - a.href.length)[0]?.href;
  const sections = SECTIONS.map((section) => ({
    ...section,
    isActive: section.href === activeHref,
  }));

  return (
    <nav aria-label="Hovedmeny" className={cx("mb-3", className)}>
      <div className="flex h-12 items-center justify-between">
        <ul className="hidden items-center gap-5 sm:flex">
          {sections.map(({ href, label, isActive }) => (
            <li key={href}>
              <NavLink href={href} isActive={isActive}>
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-2">
          <Link href={user ? "/profile" : "/login"} className="text-foreground hover:text-accent">
            {user ? (
              user.firstName
            ) : (
              <Avatar size="sm" aria-label="Logg inn">
                <Avatar.Fallback>
                  <GoPersonFill className="size-5" aria-hidden="true" />
                </Avatar.Fallback>
              </Avatar>
            )}
          </Link>
          <Button
            className="sm:hidden"
            variant="secondary"
            isIconOnly
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={isMenuOpen ? "Lukk menyen" : "Åpne menyen"}
            onPress={() => setIsMenuOpen((open) => !open)}
          >
            <span aria-hidden>{isMenuOpen ? "×" : "☰"}</span>
          </Button>
        </div>
      </div>

      {isMenuOpen && (
        <ul
          id="mobile-navigation"
          className="border-default-200 bg-content1/60 mb-3 flex flex-col gap-1 rounded-2xl border p-2 sm:hidden"
        >
          {sections.map(({ href, label, isActive }) => (
            <li key={href}>
              <Link
                href={href}
                onClick={() => setIsMenuOpen(false)}
                aria-current={isActive ? "page" : undefined}
                className={cx(
                  "flex h-11 items-center rounded-xl px-3 transition-colors outline-focus focus-visible:outline-2 focus-visible:outline-offset-2",
                  isActive
                    ? "bg-primary-100 text-primary-800 font-semibold"
                    : "text-foreground/80 hover:bg-default-100 hover:text-foreground",
                )}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
};
