import Link from "next/link";
import { cacheLife } from "next/cache";
import { Logo } from "@/components/Logo";

// Part of the static shell every page shares, so the year is worked out once
// a day rather than once per visit, or once per build (which would leave the
// footer a year behind after New Year until the next release).
const thisYear = async () => {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
};

// The footer closes the page on the same dark stage the channel bar opens it
// with. The copyright and the links wrap to their own lines on a narrow
// screen, so nothing has to be hidden to make room.
export const Footer = async () => (
  <footer className="mt-16 w-full bg-stage text-stage-muted">
    <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-10 gap-y-4 px-4 py-8 text-sm sm:px-6">
      <Logo className="h-7 w-auto text-stage-foreground" />
      <div>© 2009 - {await thisYear()} Foreningen Frikanalen</div>

      <div className="flex gap-6">
        <Link className="py-2 hover:text-stage-foreground" href="https://github.com/Frikanalen">
          GitHub
        </Link>
        <Link className="py-2 hover:text-stage-foreground" href="https://frikanalen.tv/api">
          API
        </Link>
      </div>
    </div>
  </footer>
);
