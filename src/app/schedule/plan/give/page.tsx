import { getUserOrNull } from "@/app/getUserOrNull";
import { GiveAirtime } from "@/app/grants/GiveAirtime";
import type { Organization } from "@/generated/frikanalenDjangoAPI.schemas";
import { organizationList } from "@/generated/organization/organization";
import { getCookiesFromRequest } from "@/lib/getCookiesFromRequest";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

// Per-visitor: rendered on request, without a static shell of its own.
export const instant = false;

export const metadata: Metadata = {
  title: "Gi sendetid - Frikanalen",
};

/** Staff give an organization airtime one time here, without a request. */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ organization?: string }>;
}) {
  const headers = await getCookiesFromRequest();
  const user = await getUserOrNull(headers);
  if (!user) redirect("/login");
  if (!user.isStaff) redirect("/profile");

  const organizations: Organization[] = (
    await organizationList({ limit: 1000, ordering: "name" }, { headers })
  ).data.results;
  const requested = Number((await searchParams).organization);

  return (
    <main className="w-full max-w-[90rem] grow space-y-5 px-4 pt-10 pb-10 sm:px-6">
      <header>
        <Link className="text-sm font-semibold text-link hover:underline" href="/schedule/plan">
          ← Sendetid
        </Link>
        <h1 className="mt-1 text-4xl font-bold tracking-tight sm:text-5xl">Gi sendetid</h1>
        <p className="mt-2 max-w-3xl text-default-600">
          Gi en organisasjon sendetid én gang. Dra eller trykk i en ledig del av uken, eller skriv
          inn tiden. For sendetid som kommer igjen hver uke, bruk{" "}
          <Link className="font-semibold text-link hover:underline" href="/schedule/plan/slots">
            faste sendeflater
          </Link>
          .
        </p>
      </header>
      <GiveAirtime
        initialOrganization={
          organizations.some(({ id }) => id === requested) ? requested : undefined
        }
        organizations={organizations}
      />
    </main>
  );
}
