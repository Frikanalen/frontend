"use client";
import Link from "next/link";
import cx from "classnames";
import { usePathname } from "next/navigation";

/** The member tools for one organisation, as a bar under the channel bar. */
export const StudioNav = ({
  organizationId,
  showStart = false,
}: {
  organizationId: number;
  /** While the organization is still on its way in, "Kom i gang" leads the bar. */
  showStart?: boolean;
}) => {
  const path = usePathname();
  const base = `/organization/${organizationId}`;
  const sections = [
    ...(showStart
      ? [{ href: `${base}/start`, label: "Kom i gang", active: path.startsWith(`${base}/start`) }]
      : []),
    { href: `${base}/admin`, label: "Videoer", active: path.startsWith(`${base}/admin`) },
    { href: `${base}/schedule`, label: "Sendetid", active: path.startsWith(`${base}/schedule`) },
    { href: `${base}/series`, label: "Serier", active: path.startsWith(`${base}/series`) },
    { href: `${base}/live`, label: "Direktesending", active: path.startsWith(`${base}/live`) },
    { href: base, label: "Offentlig side", active: path === base },
  ];

  return (
    <div className="w-full border-b border-default-200 bg-background">
      <nav
        aria-label="Studio"
        className="mx-auto flex w-full max-w-7xl items-center gap-x-7 overflow-x-auto px-4 sm:px-6"
      >
        <span className="shrink-0 border-e border-default-300 pe-6 text-xs font-bold tracking-[0.14em] text-default-600 uppercase">
          Studio
        </span>
        <ul className="flex items-center gap-x-7 font-medium whitespace-nowrap">
          {sections.map(({ href, label, active }) => (
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
          ))}
        </ul>
        <Link
          className="ms-auto shrink-0 py-3 font-semibold text-primary-700 hover:underline"
          href={`${base}/create`}
        >
          + Ny video
        </Link>
      </nav>
    </div>
  );
};
