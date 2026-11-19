import { Metadata } from "next";
import Link from "next/link";
import { AboutHeading } from "@/app/about/AboutHeading";

export const metadata: Metadata = {
  title: "Slik fordeles sendetiden - Frikanalen",
  description:
    "Hvordan Frikanalen fordeler sendetid mellom medlemsorganisasjonene, og hvordan sendeplanen blir til.",
};

const link = "font-semibold text-link hover:underline";

/** The steps from a regular slot to what is on air, in the order they happen. */
const STEPS = [
  {
    title: "Organisasjonen får sendetid",
    body: (
      <>
        <p>
          En sendetid er et konkret tidsrom på en bestemt dag som tilhører én organisasjon. Det er
          to måter å få sendetid på:
        </p>
        <ul className="list-disc space-y-2 ps-5">
          <li>
            <strong>Automatisk, fra en fast sendeflate.</strong> En fast sendeflate er et fast
            tidsrom som tilhører én medlemsorganisasjon, for eksempel hver torsdag kl. 19.00–20.00.
            Organisasjonen får sendetid for hver dag flaten gjelder, uten å måtte be om det.
            Sendetiden for en uke opprettes natt til mandag to uker før, så organisasjonen har en
            uke på å planlegge før fristen.
          </li>
          <li>
            <strong>Enkeltvis, etter avtale.</strong> Frikanalen kan også gi sendetid én gang, for
            eksempel til en direktesending eller ett enkelt program.
          </li>
        </ul>
        <p>
          Alle faste sendeflater er offentlige.{" "}
          <Link className={link} href="/schedule/slots">
            Se hvem som har hvilke flater
          </Link>
          .
        </p>
      </>
    ),
  },
  {
    title: "Organisasjonen fyller sendetiden",
    body: (
      <>
        <p>
          Organisasjonen bestemmer selv hva som sendes i sin sendetid, og ingen andre kan legge noe
          inn der. Den kan velge programmene selv, eller la sendetiden fylle seg automatisk med egne
          programmer: det nyeste som ikke har vært sendt, eller neste episode i en serie.
        </p>
        <p>
          En organisasjon kan også sende programmer fra andre. Den som eier et program, er ansvarlig
          redaktør for det.
        </p>
      </>
    ),
  },
  {
    title: "Uken låses",
    body: (
      <>
        <p>
          Ved midnatt natt til mandag, uken før sending, låses planen for hele uken, og sendeplanen
          blir til. Slik kan seere og programoversikter vite hva som sendes en uke i forveien.
        </p>
        <p>
          Trenger en organisasjon å endre noe etter fristen, for eksempel rundt en direktesending,
          kan den be Frikanalen om det.
        </p>
        <p>
          Sendetid som ikke er fylt ved fristen, også tid som blir igjen etter siste program, går
          tapt for organisasjonen. Den kan da brukes av andre organisasjoner. Blir den stående tom,
          viser kanalen grafikk med programoversikt og informasjon.
        </p>
      </>
    ),
  },
];

export default function Airtime() {
  return (
    <>
      <AboutHeading lead="Frikanalen er medlemsorganisasjonenes kanal. Her forklarer vi hvordan sendetiden deles mellom dem, og hvordan sendeplanen blir til.">
        Slik fordeles sendetiden
      </AboutHeading>

      <ol className="max-w-3xl space-y-8 border-t border-foreground pt-8">
        {STEPS.map(({ title, body }, index) => (
          <li className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-4" key={title}>
            <span
              aria-hidden
              className="flex size-9 items-center justify-center rounded-full bg-brand-green font-bold text-white"
            >
              {index + 1}
            </span>
            <div className="space-y-3 text-default-800">
              <h2 className="text-2xl font-bold text-foreground">{title}</h2>
              {body}
            </div>
          </li>
        ))}
      </ol>

      <section className="max-w-3xl space-y-3 text-default-800">
        <h2 className="text-2xl font-bold text-foreground">Frikanalens egne sendinger</h2>
        <p>
          I tid som ikke er gitt til et medlem, setter Frikanalen selv opp sendinger: programmer fra
          arkivet, sendinger vi formidler videre, som Stortingets møter, og informasjon til seerne.
        </p>
      </section>

      <section className="flex flex-wrap items-center gap-x-8 gap-y-4 bg-background p-6 sm:p-8">
        <div className="min-w-0 grow basis-80">
          <h2 className="text-2xl font-bold">Vil organisasjonen din ha sendetid?</h2>
          <p className="mt-1 text-default-700">
            Medlemmer ber om sendetid fra Studio, under Sendetid. Er dere ikke medlem ennå, starter
            dere med å melde dere inn.
          </p>
        </div>
        <Link
          className="inline-flex h-11 items-center rounded-md bg-accent px-5 font-semibold text-accent-foreground hover:opacity-90"
          href="/about/join"
        >
          Bli medlem
        </Link>
      </section>
    </>
  );
}
