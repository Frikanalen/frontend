import type { Metadata } from "next";

export { default } from "../protest";

const title = "Frikanalen går i svart i protest mot udemokratisk overtakelse av kanalen";
const description =
  "Mandag 2. november kl. 18.00 erstattes Frikanalens ordinære sendinger av en kunngjøring om " +
  "hvorfor vi har valgt å la kanalen gå i svart: en langvarig konflikt om demokratisk styring, " +
  "åpenhet og maktkonsentrasjon som har kulminert i en ulovlig overtakelse av organisasjonen.";

// The og:image and twitter:image come from opengraph-image.tsx next to this file.
export const metadata: Metadata = {
  title: `${title} - Frikanalen`,
  description,
  alternates: { canonical: "/protest" },
  openGraph: {
    type: "article",
    url: "/protest",
    siteName: "Frikanalen",
    locale: "nb_NO",
    title,
    description,
    authors: ["Tom Fredrik Blenning"],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};
