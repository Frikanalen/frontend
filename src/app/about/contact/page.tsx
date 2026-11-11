import { Metadata } from "next";
import { AboutHeading } from "@/app/about/AboutHeading";

export const metadata: Metadata = {
  title: "Kontakt Frikanalen",
};

const CONTACTS = [
  { role: "Styreleder", name: "Tom Fredrik Blenning", email: "post@frikanalen.tv" },
  { role: "Teknisk leder", name: "Tore Sinding Bekkedal", email: "toresbe@protonmail.com" },
];

export default async function Contact() {
  return (
    <>
      <AboutHeading>Kontakt</AboutHeading>
      <ul className="grid max-w-3xl gap-x-10 border-t border-foreground sm:grid-cols-2">
        {CONTACTS.map(({ role, name, email }) => (
          <li className="border-b border-default-200 py-5" key={email}>
            <p className="text-sm font-semibold tracking-wide text-default-600 uppercase">{role}</p>
            <p className="mt-1 text-xl font-bold">{name}</p>
            <a
              className="font-semibold break-all text-link hover:underline"
              href={`mailto:${email}`}
            >
              {email}
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}
