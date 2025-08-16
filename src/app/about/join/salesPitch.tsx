"use client";

import Link from "next/link";

export const SalesPitch = () => (
  <div className="w-full">
    <p>Ved å melde din organisasjon inn i Frikanalen, får du:</p>
    <ul>
      <li>Lagre videoinnhold i et reklamefritt arkiv tilgjengelig for alle</li>
      <li>Muligheten til å sende ditt innhold på Frikanalen</li>
      <li>Stemmerett ved Foreningen Frikanalens møter</li>
    </ul>
    <p>
      En medlemsorganisasjon må velge en ansvarlig redaktør som påtar seg juridisk redaktøransvar
      for innhold. Organisasjonens besøks- og postadresse, samt redaktørens epost og telefonnummer,
      må være tilgjengelig ihht.{" "}
      <Link href={"https://lovdata.no/lov/1992-12-04-127/§2-16"}>Kringkastingsloven §2-16</Link>.
    </p>
  </div>
);
