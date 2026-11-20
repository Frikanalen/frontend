import { Metadata } from "next";
import Link from "next/link";
import { AboutHeading } from "@/app/about/AboutHeading";

export const metadata: Metadata = {
  title: "Bli medlem",
  description: "Bli medlem i Frikanalen",
};

const BENEFITS = [
  {
    title: "Et åpent arkiv",
    text: "Lagre videoinnhold i et åpent, reklamefritt arkiv tilgjengelig for alle.",
  },
  { title: "Sendetid", text: "Muligheten til å sende innholdet ditt på Frikanalen." },
  { title: "Stemmerett", text: "Stemmerett ved Foreningen Frikanalens møter." },
];

const FEES = [
  ["Under kr 500 000", "kr 1000"],
  ["Mellom kr 0,5 og 2 millioner", "kr 4000"],
  ["Mellom kr 2 og 10 millioner", "kr 8000"],
  ["Over kr 10 millioner", "kr 12000"],
];

const Join = () => (
  <>
    <AboutHeading lead="Ved å melde organisasjonen din inn i Frikanalen, får dere:">
      Bli medlem
    </AboutHeading>

    <ul className="grid gap-x-10 gap-y-6 border-t border-foreground pt-8 md:grid-cols-3">
      {BENEFITS.map(({ title, text }) => (
        <li key={title}>
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="mt-2 text-default-700">{text}</p>
        </li>
      ))}
    </ul>

    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <section className="max-w-3xl space-y-4 text-lg">
        <h2 className="text-2xl font-bold">Redaktøransvar</h2>
        <p>
          Organisasjoner må utpeke en ansvarlig redaktør som påtar seg juridisk redaktøransvar for
          organisasjonens innhold på Frikanalen. I henhold til{" "}
          <Link
            className="font-semibold text-link underline"
            href={"https://lovdata.no/dokument/NL/lov/1992-12-04-127/KAPITTEL_2#%C2%A72-16"}
          >
            kringkastingsloven §2-16
          </Link>{" "}
          må organisasjonen offentlig oppgi besøks- og postadresse for organisasjonen, samt navn og
          epostadresse for ansvarlig redaktør.
        </p>
        <p>
          Etter innmelding må redaktøren signere en erklæring av redaktøransvar{" "}
          <span className={"whitespace-nowrap"}>
            (
            <Link
              aria-label={"eksempelerklæring av redaktøransvar"}
              className="font-semibold text-link underline"
              href={"/about/join/affidavit"}
            >
              se eksempel her
            </Link>
            )
          </span>{" "}
          og sende den til foreningen per post. Først når brev er mottatt vil organisasjonens
          videoer bli offentlig synlige.
        </p>
      </section>

      <section className="bg-background p-6 sm:p-8">
        <h2 className="text-2xl font-bold">Medlemskontingent</h2>
        <p className="mt-1 text-default-700">Settes etter organisasjonens omsetning, per år.</p>
        <table className="mt-4 w-full text-left">
          <thead className="text-sm text-default-600">
            <tr className="border-b border-foreground">
              <th className="py-2 font-semibold">Omsetning</th>
              <th className="py-2 text-right font-semibold">Årlig kontingent</th>
            </tr>
          </thead>
          <tbody>
            {FEES.map(([turnover, fee]) => (
              <tr className="border-b border-default-200" key={turnover}>
                <td className="py-3">{turnover}</td>
                <td className="py-3 text-right font-bold whitespace-nowrap">{fee}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h3 className="mt-6 font-bold">Enkeltpersonmedlemskap</h3>
        <p className="mt-1 text-default-700">
          Enkeltpersoner kan tegne årlig medlemskap for kr 1000. Enkeltpersonmedlemskap medfører
          ikke medlemsrettigheter.
        </p>
      </section>
    </div>

    <section className="flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-foreground pt-8">
      <div className="min-w-0 grow basis-80">
        <h2 className="text-2xl font-bold">Klar til å melde dere inn?</h2>
        <p className="mt-1 text-default-700">
          Fire steg til aktivt medlemskap. Vi viser dere veien.
        </p>
      </div>
      <Link
        className="inline-flex h-11 items-center rounded-md bg-accent px-5 font-semibold text-accent-foreground hover:opacity-90"
        href="/organization/register"
      >
        Kom i gang
      </Link>
      <Link className="font-semibold text-link hover:underline" href="/about/contact">
        Spør oss først
      </Link>
    </section>
  </>
);

export default Join;
