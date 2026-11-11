import { Metadata } from "next";
import Link from "next/link";
import React from "react";

export const metadata: Metadata = {
  title: "Om Frikanalen",
  description: "Informasjon om Frikanalen og hvordan du kan bli medlem",
};

const FACTS = [
  {
    title: "Uten forhåndssensur",
    text: "Medlemmene lager og sender programmene selv. Hvert medlem har en ansvarlig redaktør og står selv for innholdet i sine sendinger.",
  },
  {
    title: "Riksdekkende TV-kanal",
    text: "Alle medlemmer får adgang til en riksdekkende kanal med formidlingsplikt. Det betyr at alle kabelleverandører er forpliktet til å bære den.",
  },
  {
    title: "Åpent arkiv",
    text: "Programmene ligger i et åpent, reklamefritt arkiv, tilrettelagt for behovene til norsk demokrati, organisasjonsliv og frivillighet.",
  },
];

export default function About() {
  return (
    <>
      <header className="max-w-4xl">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Frikanalen er sivilsamfunnets videoplattform.
        </h1>
        <p className="mt-6 max-w-3xl text-xl text-default-700">
          Sammen med medlemsorganisasjonene våre utvikler vi en videoplattform uten forhåndssensur,
          for frivilligheten og organisasjonslivet i Norge.
        </p>
      </header>

      <figure className="max-w-3xl border-l-4 border-brand-green ps-6">
        <blockquote className="text-2xl leading-snug font-semibold sm:text-3xl">
          «Målet med Frikanalen er å styrke ytringsfrihet og deltakerdemokratiet ved å gi flere
          mulighet til å ytre seg i TV-mediet»
        </blockquote>
        <figcaption className="mt-3 text-default-600">
          Frikanalens formålsparagraf ·{" "}
          <Link className="font-semibold text-link hover:underline" href="/about/statutes">
            Les vedtektene
          </Link>
        </figcaption>
      </figure>

      <ul className="grid gap-x-10 gap-y-8 border-t border-foreground pt-8 md:grid-cols-3">
        {FACTS.map(({ title, text }) => (
          <li key={title}>
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="mt-2 text-default-700">{text}</p>
          </li>
        ))}
      </ul>

      <section className="flex flex-wrap items-center gap-x-8 gap-y-4 bg-background p-6 sm:p-8">
        <div className="min-w-0 grow basis-80">
          <h2 className="text-2xl font-bold">Vil organisasjonen din lage fjernsyn?</h2>
          <p className="mt-1 text-default-700">
            Medlemskap er åpent for alle som driver frivillig virke på ikke-kommersiell basis.
          </p>
        </div>
        <Link
          className="inline-flex h-11 items-center rounded-md bg-accent px-5 font-semibold text-accent-foreground hover:opacity-90"
          href="/about/join"
        >
          Bli medlem
        </Link>
        <Link className="font-semibold text-link hover:underline" href="/about/contact">
          Kontakt oss
        </Link>
      </section>
    </>
  );
}
