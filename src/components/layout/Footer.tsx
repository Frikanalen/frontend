"use client";

import { Link } from "@heroui/react";

export const Footer = () => (
  <footer className={"pt-10 pb-9 flex justify-between max-w-3xl w-full px-4"}>
    <div>© 2009 - {new Date().getFullYear()} Foreningen Frikanalen</div>
    <div className="flex gap-4">
      <Link href="https://github.com/Frikanalen">GitHub</Link>
      <Link href="https://frikanalen.no/api/">API</Link>
    </div>
  </footer>
);
