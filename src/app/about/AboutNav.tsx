"use client";
import Link from "next/link";
import cx from "classnames";
import { usePathname } from "next/navigation";

const SECTIONS = [
  { href: "/about", label: "Om oss", exact: true },
  { href: "/about/join", label: "Bli medlem" },
  { href: "/about/statutes", label: "Vedtekter" },
  { href: "/about/contact", label: "Kontakt" },
];

/**
 * The pages about Frikanalen itself, as a bar under the channel bar. They used
 * to be reachable only from two rows at the foot of the first one.
 */
export const AboutNav = () => {
  const path = usePathname();
  return (
    <div className="w-full border-b border-default-200 bg-background">
      <nav
        aria-label="Om Frikanalen"
        className="mx-auto flex w-full max-w-7xl items-center gap-x-7 overflow-x-auto px-4 sm:px-6"
      >
        <span className="hidden shrink-0 border-e border-default-300 pe-6 text-xs font-bold tracking-[0.14em] text-default-600 uppercase sm:block">
          Om Frikanalen
        </span>
        <ul className="flex items-center gap-x-7 font-medium whitespace-nowrap">
          {SECTIONS.map(({ href, label, exact }) => {
            const active = exact ? path === href : path.startsWith(href);
            return (
              <li key={href}>
                <Link
                  aria-current={active ? "page" : undefined}
                  className={cx(
                    "block border-b-2 py-3 outline-focus focus-visible:outline-2",
                    active
                      ? "border-brand-green font-semibold text-foreground"
                      : "border-transparent text-default-600 hover:text-foreground",
                  )}
                  href={href}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};
