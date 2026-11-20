/**
 * What the editor declares, word for word. One text for the public page, the
 * declaration page and the PDF an organization prints and signs, so they never
 * drift apart. A clause is plain text, or text around one link.
 */
export type AffidavitClause =
  string | { before: string; link: { href: string; text: string }; after: string };

export const AFFIDAVIT_INTRO = "Som redaktør på vegne av min organisasjon erklærer jeg:";

export const AFFIDAVIT_CLAUSES: readonly AffidavitClause[] = [
  {
    before:
      "At min organisasjon driver frivillig virke på ikke-fortjenestebasert/ikke-offentlig basis i Norge i henhold til avgrensningene i ",
    link: {
      href: "https://lovdata.no/lov/2007-06-29-88/§3",
      text: "lov om frivillighetsregister § 3 og § 4",
    },
    after:
      ". Vår økonomiske støtte er transparent og legger ingen føringer for virksomheten eller for innholdet vi publiserer.",
  },
  "Å ta det fulle ansvaret for alt innhold som min organisasjon har lastet opp, satt på sendeplanen eller gjort tilgjengelig for strømming fra arkivet.",
  "Å overholde gjeldende lover og regelverk for kringkasting, ytringsfrihet, personvern og opphavsrett.",
  "Å kjenne det strafferettslige ansvaret som påløper meg og min organisasjon ved overtredelse av ytringsfrihetens grenser. Jeg står personlig til ansvar for brudd på norsk lov.",
  "At for hver kringkasting er all musikk klarert med rettighetsorganisasjonene og at dette kan dokumenteres på forespørsel.",
  "Ansvar for alle kostnader som er forbundet med kringkasting av rettighetsbelagt innhold. Kringkasting av rettighetsbelagt innhold kan være svært kostbart.",
  "Å avstå fra bruk av sendeflaten til kommersielle formål, det være seg reklame, sponsorplakater og produktplassering.",
  "Å holde Foreningen Frikanalen ansvarsfri for ethvert krav, tap eller skade som rettes mot Foreningen Frikanalen fra en tredjepart som følge av brudd på punktene ovenfor, herunder kompensasjon som Foreningen Frikanalen blir ilagt å betale rettighetsorganisasjoner for mangelfull klarering av rettigheter på kanalen.",
  "Å lage en plakat før og etter hvert innslag som opplyser om organisasjon og redaktør.",
  "Å melde fra om endringer i kontaktinformasjonen for meg eller min organisasjon.",
];
