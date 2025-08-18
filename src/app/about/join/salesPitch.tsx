"use client";

import { Link } from "@heroui/react";

export const SalesPitch = () => (
  <div className="w-full prose dark:prose-invert prose-lg">
    <p>Ved å melde din organisasjon inn i Frikanalen, får du:</p>
    <ul>
      <li>Lagre videoinnhold i et åpent, reklamefritt arkiv tilgjengelig for alle</li>
      <li>Muligheten til å sende ditt innhold på Frikanalen</li>
      <li>Stemmerett ved Foreningen Frikanalens møter</li>
    </ul>
    <p className={"text-medium"}>
      Organisasjoner må utpeke en ansvarlig redaktør som påtar seg juridisk redaktøransvar for
      organisasjonens innhold på Frikanalen. I henhold til{" "}
      <Link href={"https://lovdata.no/dokument/NL/lov/1992-12-04-127/KAPITTEL_2#%C2%A72-16"}>
        kringkastingsloven §2-16
      </Link>{" "}
      må organisasjonen offentlig oppgi besøks- og postadresse for organisasjonen, samt navn og
      epostadresse for ansvarlig redaktør.
    </p>
    <p className={"text-medium"}>
      Etter innmelding må redaktøren signere en erklæring av redaktøransvar{" "}
      <span className={"whitespace-nowrap"}>
        (
        <Link aria-label={"eksempelerklæring av redaktøransvar"} href={"/about/join/affidavit"}>
          se eksempel her
        </Link>
        )
      </span>{" "}
      og sende den til foreningen per post. Først når brev er mottatt vil organisasjonens videoer
      bli offentlig synlige.
    </p>
  </div>
);
