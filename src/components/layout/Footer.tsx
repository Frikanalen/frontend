"use client";

import { Link } from "@heroui/react";

export const Footer = () => (
  <footer className={"pt-4 pb-2 flex justify-between max-w-3xl w-full px-4"}>
    <div>© 2009 - {new Date().getFullYear()} Foreningen Frikanalen</div>
    <div className="flex gap-2">
      <Link href="https://github.com/Frikanalen/frikanalen">GitHub</Link>
      <Link href="https://frikanalen.no/api/">API</Link>
      <Link href="https://frikanalen.no/xmltv/">XMLTV</Link>
    </div>
  </footer>
);
