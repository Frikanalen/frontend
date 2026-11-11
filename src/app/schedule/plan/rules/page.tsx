import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Slik virker sendetid",
  description: "Hvordan organisasjoner får sendetid på Frikanalen og setter opp hva som sendes.",
};

export default function Page() {
  return (
    <main className="w-full max-w-3xl grow px-4 pb-10">
      <article className="prose max-w-none rounded-xl bg-background p-6 shadow-lg dark:prose-invert">
        <h1>Slik virker sendetid</h1>

        <p>
          Frikanalen gir medlemsorganisasjoner <strong>sendetid</strong>: et tidsrom på kanalen som
          tilhører én organisasjon. Organisasjonen bestemmer hva som sendes i sin sendetid ved å
          sette opp en liste med videoer. Sendeplanen lages av disse listene; ingen andre kan legge
          noe inn i deres sendetid.
        </p>

        <h2>Hvor kommer sendetiden fra?</h2>
        <ul>
          <li>
            <strong>Faste sendeflater</strong>, for eksempel hver torsdag kl. 19.00. Hver gang
            flaten kommer igjen, får organisasjonen en ny sendetid.
          </li>
          <li>
            <strong>Enkeltstående sendetid</strong> som Frikanalen gir direkte, for eksempel til en
            direktesending.
          </li>
        </ul>

        <h2>Hvem kan sette opp en liste?</h2>
        <ul>
          <li>Du må være innlogget, og identiteten din må være bekreftet av Frikanalen.</li>
          <li>Du må være medlem eller redaktør i organisasjonen som har sendetiden.</li>
          <li>
            Listen kan inneholde videoer fra hvilken som helst organisasjon. Den som eier videoen,
            er fortsatt ansvarlig redaktør for den.
          </li>
          <li>Videoene må samlet få plass i sendetiden. Det som er igjen, viser grafikk.</li>
        </ul>

        <h2>Frist</h2>
        <p>
          Hver sendetid har en frist. Vanligvis er det mandagen uken før sendingen. Frem til fristen
          kan dere endre listen så ofte dere vil. Ved fristen låses den, og sendeplanen lages av
          den. Slik vet seere og programoversikter hva som sendes, en uke i forveien.
        </p>
        <p>
          Trenger dere å endre noe etter fristen, for eksempel rundt en direktesending, kan
          Frikanalen unnta sendetiden fra låsing. Da kan listen endres helt frem til sending.
        </p>

        <h2>Automatisk fylling</h2>
        <p>
          Sendetid fra en fast sendeflate fylles automatisk, normalt med organisasjonens nyeste
          videoer. Gjør dere ingenting, blir sendetiden likevel fylt. Endrer dere listen selv,
          slutter den å fylles automatisk; velg <em>Fyll automatisk igjen</em> for å gå tilbake.
        </p>

        <h2>Video som ikke er ferdig</h2>
        <p>
          Blir ikke filen ferdig før fristen, kan dere opprette videoen først, med tittel og lengde
          fylt inn for hånd, og sette den på listen. Filen kan lastes opp senere. Er den ikke kommet
          når sendingen starter, vises en melding om at programmet ikke er tilgjengelig.
        </p>

        <h2>Tid uten program</h2>
        <p>
          Tid som ikke er satt opp, også tom sendetid og det som er igjen etter siste video, viser
          kanalgrafikk.
        </p>

        <p>
          Gå til <Link href="/profile">Min side</Link> og velg <em>Sendetid</em> under riktig
          organisasjon.
        </p>
      </article>
    </main>
  );
}
