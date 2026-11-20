import Link from "next/link";
import type { ReactNode } from "react";

/**
 * The top of every Studio page: where you are, one line on what the page is
 * for, and the page's main action at the right. The organization's name is in
 * the studio bar above, so it is not repeated here.
 */
export const StudioHeader = ({
  title,
  intro,
  action,
  back,
}: {
  title: ReactNode;
  intro?: ReactNode;
  action?: ReactNode;
  /** A page one level down: the way back up. */
  back?: { href: string; label: string };
}) => (
  <header className="mb-6 flex flex-wrap items-start gap-x-6 gap-y-3">
    <div className="min-w-0 grow">
      {back ? (
        <Link
          className="text-sm text-default-600 underline-offset-4 hover:text-foreground hover:underline"
          href={back.href}
        >
          ← {back.label}
        </Link>
      ) : null}
      <h1 className="text-3xl font-bold tracking-tight break-words sm:text-4xl">{title}</h1>
      {intro ? <div className="mt-2 max-w-3xl text-default-600">{intro}</div> : null}
    </div>
    {action ? <div className="flex shrink-0 flex-wrap items-center gap-3">{action}</div> : null}
  </header>
);
