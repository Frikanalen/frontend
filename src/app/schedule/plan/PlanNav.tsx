"use client";
import cx from "classnames";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SECTIONS = [
  { href: "/schedule/plan", label: "Uke" },
  { href: "/schedule/plan/slots", label: "Faste sendeflater" },
  { href: "/schedule/plan/requests", label: "Forespørsler" },
  { href: "/schedule/plan/rules", label: "Slik virker det" },
] as const;

/**
 * The staff tools for airtime, side by side, on every one of their pages,
 * so none of them is a dead end.
 */
export const PlanNav = () => {
  const pathname = usePathname();
  return (
    <nav aria-label="Sendetid" className="border-b border-separator">
      <ul className="-mb-px flex gap-x-5 overflow-x-auto">
        {SECTIONS.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <li className="shrink-0" key={href}>
              <Link
                aria-current={active ? "page" : undefined}
                className={cx(
                  "block border-b-2 py-2 text-sm font-semibold",
                  active
                    ? "border-accent text-foreground"
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
  );
};

/** The heading every staff airtime page opens with. */
export const PlanHeader = ({
  title,
  children,
  staff = true,
}: {
  title: string;
  children?: React.ReactNode;
  /** The guide is also for members, who get no tabs. */
  staff?: boolean;
}) => (
  <header className="space-y-3">
    {staff ? <PlanNav /> : null}
    <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
    {children ? <div className="max-w-3xl text-default-600">{children}</div> : null}
  </header>
);
