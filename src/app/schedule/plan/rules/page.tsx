import { schedulingPolicyRetrieve } from "@/generated/scheduling/scheduling";
import { inOsloTime } from "@/lib/osloTime";
import { format } from "date-fns";
import { nb } from "date-fns/locale/nb";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Regler for sendeplanlegging",
  description: "Hvem som kan programmere Frikanalens sendeplan, og hvordan ledig sendetid virker.",
};

const osloDate = (instant: string) =>
  format(inOsloTime(instant), "EEEE d. MMMM yyyy", { locale: nb });

export default async function Page() {
  const policy = (await schedulingPolicyRetrieve()).data;

  return (
    <main className="w-full max-w-3xl grow px-4 pb-10">
      <article className="prose max-w-none rounded-xl bg-background p-6 shadow-lg dark:prose-invert">
        <h1>Slik programmerer du sendeplanen</h1>

        <p>
          Medlemsorganisasjoner kan velge egne ferdigbehandlede videoer til den åpne sendeuken.
          Reglene under gjelder vanlige brukere. Frikanalens administratorer kan gjøre nødvendige
          rettelser utenfor disse grensene.
        </p>

        <h2>Hvem kan legge inn en video?</h2>
        <p>Alle disse vilkårene må være oppfylt:</p>
        <ul>
          <li>Du må være innlogget, og identiteten din må være bekreftet av Frikanalen.</li>
          <li>Du må være medlem eller redaktør i organisasjonen du programmerer på vegne av.</li>
          <li>Organisasjonen må ha aktivt medlemskap i Frikanalen.</li>
          <li>Videoen må tilhøre denne organisasjonen og være ferdigbehandlet etter opplasting.</li>
        </ul>

        <h2>Når kan sendeplanen endres?</h2>
        <p>
          En sendeuke går fra mandag klokken 00.00 til neste mandag klokken 00.00, norsk tid. Den
          åpne uken er uken etter de to ukene som allerede er låst. Senere uker er ikke klargjort
          ennå.
        </p>
        <p className="not-prose rounded-lg border border-primary-200 bg-primary-50 p-4 dark:bg-primary-950">
          <strong>Åpen sendeuke nå:</strong> {osloDate(policy.freezeBoundary)} kl. 00.00 til{" "}
          {osloDate(policy.schedulingHorizon)} kl. 00.00. Sluttidspunktet er ikke med i den åpne
          uken.
        </p>
        <p>
          Hele sendingen må ligge innenfor den åpne uken. Når uken fryses mandagen før den skal
          sendes, kan vanlige brukere ikke lenger legge inn, flytte eller fjerne programmer der.
        </p>

        <h2>Kan jeg erstatte jukeboksen?</h2>
        <p>
          <strong>Ja.</strong> Den åpne uken er normalt allerede fylt ut: faste ukesplasser legges
          inn først, og den nattlige jukeboksen fyller mesteparten av tiden som er igjen. Derfor vil
          du vanligvis se jukeboksinnslag når du programmerer — de er ikke fra en senere fase.
        </p>
        <p>
          Et innslag merket <strong>Ledig jukeboksflate</strong> er automatisk fyllstoff og kan
          erstattes av din video. Systemet fjerner jukeboksinnslagene videoen overlapper. Eventuelle
          små restflater kan være tomme frem til den nattlige jukeboksen fyller dem på nytt.
        </p>
        <p>
          Hvis det ikke vises jukeboksinnslag, kan sendetiden være en reell åpning, være for kort
          for tilgjengelig fyllstoff, eller den nattlige jobben kan ennå ikke ha kjørt.
        </p>

        <h2>Hva kan ikke overskrives?</h2>
        <ul>
          <li>Programmer som er lagt inn av en bruker, administrator eller fast ukesplass.</li>
          <li>Andre organisasjoners planlagte programmer.</li>
          <li>Programmer i en frosset sendeuke.</li>
        </ul>
        <p>
          Slike sendinger vises som <strong>Fastlagt sending</strong>. Forsøk på å overlappe dem
          blir avvist. Du kan endre eller fjerne din egen organisasjons programmer så lenge uken
          fortsatt er åpen.
        </p>

        <h2>Praktiske råd</h2>
        <ul>
          <li>Velg sendetid først og deretter video; videolengden fylles inn automatisk.</li>
          <li>
            Varigheter kan inneholde brøkdeler av et sekund, for eksempel{" "}
            <code>00:06:29.290000</code>. Behold verdien for å unngå små hull eller overlapp.
          </li>
          <li>Sendeplanen lastes inn på nytt etter lagring, slik at du ser serverens resultat.</li>
        </ul>

        <p>
          Gå tilbake til <Link href="/profile">brukersiden</Link> og velg{" "}
          <em>Programmer sendeplanen</em> under riktig organisasjon.
        </p>
      </article>
    </main>
  );
}
