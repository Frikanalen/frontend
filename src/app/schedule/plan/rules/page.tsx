import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Slik virker sendetid",
  description: "Hvordan organisasjoner får sendetid på Frikanalen og setter opp hva som sendes.",
};

export default function Page() {
  return (
    <main className="w-full max-w-3xl grow px-4 pb-10">
      <article className="prose mt-10 max-w-none bg-background p-6 sm:p-8 dark:prose-invert">
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

        <h2>Be om sendetid</h2>
        <p>
          Under <em>Sendetid</em> velger dere <em>Be om mer sendetid</em>. Der ser dere uken med de
          faste sendeflatene som allerede er tatt, og kan be om en fast sendeflate hver uke eller
          sendetid én gang. Frikanalen svarer på samme side.
        </p>

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
          Trenger dere å endre noe etter fristen, for eksempel rundt en direktesending, kan dere be
          om det fra den låste sendetiden. Godkjenner Frikanalen det, kan listen endres helt frem
          til sending.
        </p>

        <h2>Automatisk fylling</h2>
        <p>
          Sendetid fra en fast sendeflate fyller seg selv: først det nyeste som ikke har vært sendt,
          deretter arkivet, det som er sendt minst først. Organisasjonen kan la en sendeflate følge
          en av seriene sine. Gjør dere ingenting, blir sendetiden likevel fylt, og nye opplastinger
          kommer med helt frem til et døgn før sending. Videoer dere velger selv, blir stående
          først, og resten fylles rundt dem. Slå av <em>Fyll resten av tiden automatisk</em> for å
          sende bare det dere selv har satt opp.
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
          Åpne <em>Studio</em> øverst på siden og velg <em>Sendetid</em>.
        </p>
      </article>
    </main>
  );
}
