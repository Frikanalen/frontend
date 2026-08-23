"use client";

import { Link } from "@heroui/react";

// The footer carries no slab of its own: no border, no background panel. It sits
// straight on the page's own canvas and the brand glow behind it, and reads as a
// quiet colophon rather than a second piece of chrome under the content.
//
// The copyright and the links sit on one row on a wide screen and wrap to
// their own lines on a narrow one, so nothing has to be hidden to make room.
export const Footer = () => (
  <footer
    className={
      "flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-2 py-4 text-sm text-foreground-500"
    }
  >
    <div>© 2009 - {new Date().getFullYear()} Foreningen Frikanalen</div>

    <div className="flex gap-4">
      <Link
        className={"text-sm text-foreground-500 hover:text-foreground"}
        href="https://github.com/Frikanalen"
      >
        GitHub
      </Link>
      <Link
        className={"text-sm text-foreground-500 hover:text-foreground"}
        href="https://frikanalen.no/api/"
      >
        API
      </Link>
    </div>
  </footer>
);
