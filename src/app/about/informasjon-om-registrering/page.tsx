import { Alert } from "@heroui/alert";
import Link from "next/link";

export default async function Page() {
  return (
    <div className={"prose dark:prose-invert max-w-3xl"}>
      <h2>Guide: Registrering av redaktøransvar hos Medietilsynet</h2>
      <p className={"italic"}>
        Oppdatert 22. august 2025 kl. 22:00. Dette dokumentet vil bli oppdatert så snart vi har mer
        informasjon.
      </p>
      <p>
        Alle medlemmer i Frikanalen må registrere seg som tjenestetilbyder hos Medietilsynet og
        melde inn sine redaktører.
      </p>
      <p>
        Slik det er i dag, sender medlemmene på Frikanalens ansvar. Etter lovendringen har hvert
        medlem selvstendig ansvar for å være registrert.
      </p>
      <p>
        Dette er et betydelig ansvar for Frikanalen, og strengt tatt burde vi ikke tillate fortsatt
        sending i overgangsperioden. Vi har likevel valgt å gi tre ukers frist for å gjøre det
        praktisk mulig å tilpasse seg. Grunnen er at et umiddelbart stopp ville ført til at kanalen
        gikk i svart – noe som rammer alle.
      </p>
      <h3>Trinn 1 – Registrering hos Medietilsynet</h3>

      <ol>
        <li>
          Gå til{" "}
          <Link
            href={
              "https://www.medietilsynet.no/tv-film-radio/tv-kringkastere-og-bestillingstjenester/plikter-for-tv-kanaler/#Registreringsplikt"
            }
          >
            Medietilsynets nettsider
          </Link>{" "}
          og finn skjemaet for registrering som tjenestetilbyder.
        </li>
        <li>Oppgi organisasjonens opplysninger (org.nr. og kontaktinfo).</li>
        <li>Registrer hvem som er ansvarlig redaktør.</li>
        <li>Send inn skjemaet.</li>
      </ol>
      <Alert className={"max-w-2xl"}>
        <div>
          De fleste medlemmer som er organisasjoner har allerede organisasjons&shy;nummer. Dersom
          dere ikke har org.nr., må dere først registrere dere i Enhets&shy;registeret via{" "}
          <Link href={"https://www.brreg.no/bedrift/samordnet-registermelding/"}>
            Samordnet registermelding
          </Link>{" "}
          på Altinn.
        </div>
      </Alert>
      <h3>Trinn 2 – Signer bekreftelse</h3>
      <p>
        Etter registrering skal medlemmet fylle ut og signere en bekreftelse på redaktøransvar. Hvis
        dette allerede er gjort, trengs det ikke gjøres på nytt.
      </p>
      <p>
        Send dokumentet til <a href={"post@frikanalen.no"}>post@frikanalen.no</a>.
      </p>
      <h3>Trinn 3 – Bekreft til Frikanalen</h3>
      <p>
        Når registreringen og signeringen er fullført, send en kort e-post til{" "}
        <a href={"post@frikanalen.no"}>post@frikanalen.no</a> med emne: «Bekreftelse redaktøransvar
        – [Medlemsnavn]».
      </p>
      <p>Legg ved signert bekreftelse.</p>
      <h3>Frist og konsekvens</h3>
      <p>
        Alle medlemmer har tre uker fra mottak av informasjonsskriv til å gjennomføre
        registreringen.
      </p>
      <p>
        Dersom dette ikke er på plass innen fristen, vil konsekvensen være at medlemmets videoer
        blir utilgjengelige på Frikanalens flater, dette inkluderer bl. a.:
      </p>
      <ul>
        <li>Medlemmet kan ikke laste opp nye programmer.</li>
        <li>Gamle programmer tas ut av rotasjon på sendeflaten.</li>
      </ul>
    </div>
  );
}
