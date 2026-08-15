"use client";

import { Link } from "@heroui/react";

export const Footer = () => (
  <footer
    className={
      "mt-8 flex justify-center bg-default-50 w-full border-t-1 border-t-primary-100"
    }
  >
    <div className="flex items-center justify-between grow p-2 max-w-5xl">
      <div>© 2009 - {new Date().getFullYear()} Foreningen Frikanalen</div>
      <div className="flex gap-4">
        <Link href="https://github.com/Frikanalen">GitHub</Link>
        <Link href="https://frikanalen.no/api/">API</Link>
      </div>
    </div>
  </footer>
);
