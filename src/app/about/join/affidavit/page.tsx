import Link from "next/link";

export default async function Page() {
  return (
    <section className={"prose dark:prose-invert max-w-3xl p-4"}>
      <h1>Redaktøransvar Frikanalen</h1>
      <div>
        <h3>Som redaktør på vegne av min organisasjon erklærer jeg:</h3>
        <ol>
          <li>
            At min organisasjon driver frivillig virke på ikke-fortjenestebasert/ikke-offentlig
            basis i Norge i henhold til avgrensningene i{" "}
            <Link href={"https://lovdata.no/lov/2007-06-29-88/§3"}>
              lov om frivillighetsregister § 3 og § 4
            </Link>
            . Vår økonomiske støtte er transparent og legger ingen føringer for virksomheten eller
            for innholdet vi publiserer.
          </li>
          <li>
            Å ta det fulle ansvaret for alt innhold som min organisasjon har lastet opp, satt på
            sendeplanen eller gjort tilgjengelig for strømming fra arkivet.
          </li>
          <li>
            Å overholde gjeldende lover og regelverk for kringkasting, ytringsfrihet, personvern og
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
          <li>
            Å avstå fra bruk av sendeflaten til kommersielle formål, det være seg reklame,
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
          <li>Å melde fra om endringer i kontaktinformasjonen for meg eller min organisasjon.</li>
        </ol>
      </div>
    </section>
  );
}
