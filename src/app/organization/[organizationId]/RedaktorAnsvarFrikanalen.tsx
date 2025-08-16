import type { ReactNode } from "react";

export default function RedaktorAnsvarFrikanalen({
  organization,
  orgNumber,
  address,
  email,
  editorName,
  editorPhone,
}: {
  organization: ReactNode;
  orgNumber: ReactNode;
  address: ReactNode;
  email: ReactNode;
  editorName: ReactNode;
  editorPhone: ReactNode;
}) {
  return (
    <article lang="no" aria-labelledby="tittel" className="prose max-w-none">
      <header className="not-prose mb-4">
        <h1 id="tittel" className="text-2xl font-semibold">
          Redaktøransvar – Frikanalen
        </h1>
      </header>

      <section aria-labelledby="orginfo" className="mb-6">
        <h2 id="orginfo" className="sr-only">
          Opplysninger om organisasjon
        </h2>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
          <div>
            <dt className="font-medium">Organisasjon</dt>
            <dd>{organization}</dd>
          </div>
          <div>
            <dt className="font-medium">
              <abbr title="organisasjonsnummer">Org.nr.</abbr>
            </dt>
            <dd>{orgNumber}</dd>
          </div>
          <div>
            <dt className="font-medium">Adresse</dt>
            <dd>{address}</dd>
          </div>
          <div>
            <dt className="font-medium">E‑post</dt>
            <dd>{email}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-medium">Redaktørs navn i blokkbokstaver</dt>
            <dd>{editorName}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-medium">Redaktørens tlf</dt>
            <dd>{editorPhone}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="erklaring" className="mb-6">
        <h2 id="erklaring" className="sr-only">
          Erklæring
        </h2>
        <p>Som redaktør på vegne av min organisasjon erklærer jeg:</p>
        <ol className="list-decimal pl-6 space-y-2">
          <li>
            At min organisasjon driver frivillig virke på ikke-fortjenestebasert/ikke-offentlig
            basis i Norge i henhold til avgrensningene i lov om frivillighetsregister § 3 og § 4.
            Vår økonomiske støtte er transparent og legger ingen føringer for virksomheten eller for
            innholdet vi publiserer.
          </li>
          <li>
            Å ta det fulle ansvaret for alt innhold som min organisasjon har lastet opp, satt på
            sendeplanen eller gjort tilgjengelig for strømming fra arkivet.
          </li>
          <li>
            Å overholde gjeldende lover og regelverk for kringkasting, ytringfrihet, personvern og
            opphavsrett.
          </li>
          <li>
            Å kjenne det strafferettslige ansvaret som påløper meg og min organisasjon ved
            overtredelse av ytringsfrihetens grenser. Jeg står personlig til ansvar for brudd på
            norsk lov.
          </li>
          <li>
            At for hver kringkasting er all musikk klarert med rettighetsorganisasjonene og at dette
            kan dokumenteres på forespørsel.
          </li>
          <li>
            Ansvar for alle kostnader som er forbundet med kringkasting av rettighetsbelagt innhold.
            Kringkasting av rettighetsbelagt innhold kan være svært kostbart.
          </li>
          {/* Nummer 7 finnes ikke i originalteksten */}
          <li value={8}>
            Å avstå bruk av sendeflaten til kommersielle formål, det være seg reklame,
            sponsorplakater og produktplassering.
          </li>
          <li>
            Å holde Foreningen Frikanalen ansvarsfri for ethvert krav, tap eller skade som rettes
            mot Foreningen Frikanalen fra en tredjepart som følge av brudd på punktene ovenfor,
            herunder kompensasjon som Foreningen Frikanalen blir ilagt å betale
            rettighetsorganisasjoner for mangelfull klarering av rettigheter på kanalen.
          </li>
          <li>
            Å lage en plakat før og etter hvert innslag som opplyser om organisasjon og redaktør.
          </li>
          <li>Å melde fra om endringer i kontaktinformasjonen på meg eller på min organisasjon.</li>
        </ol>
      </section>

      <section aria-labelledby="signering" className="mt-8">
        <h2 id="signering" className="sr-only">
          Signering
        </h2>
        <p>
          <span className="font-medium">Sted:</span> <span aria-hidden>________________</span>{" "}
          <span className="font-medium">Dato:</span> <span aria-hidden>____________</span>
        </p>
        <p>
          <span className="font-medium">Redaktørens signatur:</span>{" "}
          <span aria-hidden>____________________________________________</span>
        </p>
      </section>
    </article>
  );
}
