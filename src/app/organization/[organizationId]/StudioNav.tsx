"use client";
import Link from "next/link";
import cx from "classnames";
import { usePathname } from "next/navigation";

export type StudioSection = "start" | "videos" | "schedule" | "series" | "live" | "organization";

/**
 * The member tools for one organisation, as a bar under the channel bar.
 *
 * The organization's own name stands in the bar, so the pages under it need
 * not repeat it. Its public profile is not a tab: it is what visitors see,
 * not a tool, and on that page the bar gives way to one line pointing back.
 */
export const StudioNav = ({
  organizationId,
  organizationName,
  showStart = false,
  scheduleAttention = 0,
  section,
}: {
  organizationId: number;
  organizationName: string;
  /** While the organization is still on its way in, "Kom i gang" leads the bar. */
  showStart?: boolean;
  /** Grants that need a programme soon: shown as a count on Sendetid. */
  scheduleAttention?: number;
  /** The active tab, for pages outside /organization/<id>. */
  section?: StudioSection;
}) => {
  const path = usePathname();
  const base = `/organization/${organizationId}`;

  if (path === base) {
    return (
      <div className="w-full border-b border-default-200 bg-background">
        <p className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 text-sm text-default-700 sm:px-6">
          Dette er den offentlige siden, slik alle andre ser den.
          <Link className="font-semibold text-link hover:underline" href={`${base}/admin`}>
            Til Studio →
          </Link>
        </p>
      </div>
    );
  }

  const isActive = (key: StudioSection, href: string) =>
    section ? section === key : path.startsWith(href);
  const sections: { key: StudioSection; href: string; label: string; badge?: number }[] = [
    ...(showStart ? [{ key: "start" as const, href: `${base}/start`, label: "Kom i gang" }] : []),
    { key: "videos", href: `${base}/admin`, label: "Videoer" },
    { key: "schedule", href: `${base}/schedule`, label: "Sendetid", badge: scheduleAttention },
    { key: "series", href: `${base}/series`, label: "Serier" },
    { key: "live", href: `${base}/live`, label: "Direktesending" },
    { key: "organization", href: `${base}/profile`, label: "Organisasjon" },
  ];

  return (
    <div className="w-full border-b border-default-200 bg-background">
      <nav
        aria-label="Studio"
        className="mx-auto flex w-full max-w-7xl items-center gap-x-7 overflow-x-auto px-4 sm:px-6"
      >
        <Link
          className="flex shrink-0 items-baseline gap-2 border-e border-default-300 py-3 pe-6 outline-focus focus-visible:outline-2"
          href={`${base}/admin`}
        >
          <span className="text-xs font-bold tracking-[0.14em] text-default-600 uppercase">
            Studio
          </span>
          <span className="max-w-56 truncate font-semibold text-foreground">
            {organizationName}
          </span>
        </Link>
        <ul className="flex items-center gap-x-7 font-medium whitespace-nowrap">
          {sections.map(({ key, href, label, badge }) => {
            const active = isActive(key, href);
            return (
              <li key={key}>
                <Link
                  aria-current={active ? "page" : undefined}
                  className={cx(
                    "flex items-center gap-1.5 border-b-2 py-3 outline-focus focus-visible:outline-2",
                    active
                      ? "border-brand-green font-semibold text-foreground"
                      : "border-transparent text-default-600 hover:text-foreground",
                  )}
                  href={href}
                >
                  {label}
                  {badge ? (
                    <span
                      className="rounded-full bg-brand-amber px-1.5 text-xs font-bold text-black"
                      title={
                        badge === 1
                          ? "Én sendetid mangler program og låses snart"
                          : `${badge} sendetider mangler program og låses snart`
                      }
                    >
                      {badge}
                      <span className="sr-only"> trenger program</span>
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
        <Link
          aria-current={path.startsWith(`${base}/create`) ? "page" : undefined}
          className="ms-auto shrink-0 py-3 font-semibold text-primary-700 hover:underline"
          href={`${base}/create`}
        >
          + Ny video
        </Link>
      </nav>
    </div>
  );
};
