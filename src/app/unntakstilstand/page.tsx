import type { Metadata } from "next";
import Link from "next/link";

const title = "Frikanalen i unntakstilstand";
const description =
  "Frikanalen sender igjen, men i unntakstilstand: inntil klagen vår til Enhetsregisteret er " +
  "behandlet og en ekstraordinær generalforsamling kan avklare situasjonen, formidler vi ikke innhold fra medlemmene som sto bak forsøket på å overta " +
  "styringen av organisasjonen.";

// The og:image and twitter:image come from opengraph-image.tsx next to this file.
// Replaces the /protest statement, which next.config.ts redirects here.
export const metadata: Metadata = {
  title: `${title} - Frikanalen`,
  description,
  alternates: { canonical: "/unntakstilstand" },
  openGraph: {
    type: "article",
    url: "/unntakstilstand",
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

export default function Unntakstilstand() {
  return (
    <main className="w-full max-w-5xl grow px-2">
      <article className="prose prose-lg max-w-none dark:prose-invert">
        <h1 className="text-5xl leading-16 font-bold">{title}</h1>
        <h2 className="text-xl font-bold">
          <span className="font-normal">av</span> Tom Fredrik Blenning
          <br />
          <span className="font-normal">styreleder, Frikanalen</span>
        </h2>
        <p className="lead">
          Frikanalen sender igjen. Men inntil klagen vår til Enhetsregisteret er behandlet og en
          ekstraordinær generalforsamling kan avklare situasjonen, driver vi kanalen i
          unntakstilstand: medlemmene som sto bak forsøket på å overta styringen av organisasjonen,
          får ikke innholdet sitt formidlet.
        </p>

        <h2>Hvorfor sendingene er tilbake</h2>
        <p>
          Mandag 2. november kl. 18.00 lot vi kanalen gå i svart for å gjøre offentligheten
          oppmerksom på en ulovlig overtakelse av Frikanalen. Det formålet er oppnådd. De andre
          medlemmene våre skal ikke betale prisen for en konflikt de ikke har skapt, og derfor er de
          ordinære sendingene tilbake.
        </p>

        <h2>Hva unntakstilstanden betyr</h2>
        <p>
          PROION, Medieovervåkerne og Trond Ali Linstad er midlertidig suspendert. Innholdet deres
          er tatt ut av sendeplanen, arkivet og nettsidene.
        </p>
        <p>
          Etter vedtektene har disse medlemmene rett til å få innholdet sitt formidlet. Dette er en
          rettighet styret for egen regning velger å suspendere.
        </p>
        <p>
          Dette handler ikke om ytringsfrihet eller om hvilke synspunkter som skal kunne fremmes på
          Frikanalen. Kanalen skal være en åpen plattform, også for kontroversielle og upopulære
          synspunkter. Men det er forskjell på retten til å ytre seg og retten til å kontrollere
          kanalen.
        </p>

        <h2>Klagen til Enhetsregisteret</h2>
        <p>
          Den 19. august 2026 godkjente Brønnøysundregistrene registreringen av et styre valgt på et
          møte 6. juni 2026. Registreringen bygger på dokumenter vi mener er falske. Vi har klaget
          på vedtaket. Unntakstilstanden varer til klagen er behandlet og en ekstraordinær
          generalforsamling kan avklare situasjonen.
        </p>

        <h2>Bakgrunn</h2>
        <p>
          På det ordinære årsmøtet 26. mai 2026 ble innkalling og dagsorden godkjent, stemmeretten
          behandlet under konstitueringen og et ordinært styrevalg gjennomført. Klokken 03.45 natten
          etter sendte Ola Tellesbø en e-post til en begrenset gruppe medlemmer der han erklærte
          årsmøtet ugyldig.
        </p>
        <p>
          Den 6. juni 2026 ble det holdt et møte som ble fremstilt som et ekstraordinært årsmøte.
          Vedtektene krever minst to ukers varsel. Møtet ble innkalt med ti dagers varsel, og
          innkallingens gyldighet ble skriftlig bestridt før møtet fant sted. Møtet vedtok likevel
          en ny regel for stemmerett og valgte et nytt styre.
        </p>
        <p>
          Vi anerkjenner ikke møtet 6. juni som et gyldig ekstraordinært årsmøte. Det var ikke
          lovlig innkalt, og hadde derfor ikke kompetanse til å endre stemmerettsreglene eller velge
          et nytt styre.
        </p>
        <p>
          Frikanalen har, sammen med NRK, en unik posisjon i det norske medielandskapet gjennom
          kringkastingsforskriftens formidlingsplikt. En organisasjon som er gitt en slik
          særstilling for å fremme ytringsfrihet og deltakende demokrati, kan ikke styres gjennom
          udemokratiske prosesser.
        </p>
        <p>
          <Link href="/">Til forsiden</Link>
        </p>
      </article>
    </main>
  );
}
