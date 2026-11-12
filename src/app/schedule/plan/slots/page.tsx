import { getUserOrNull } from "@/app/getUserOrNull";
import { getCookiesFromRequest } from "@/lib/getCookiesFromRequest";
import type { Organization } from "@/generated/frikanalenDjangoAPI.schemas";
import { organizationList } from "@/generated/organization/organization";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SlotPlanner } from "./SlotPlanner";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Faste sendeflater - Frikanalen",
};

/**
 * Staff hand out regular airtime here: the recurring slots that issue every
 * organization's grants, drawn as a week.
 */
export default async function Page() {
  const headers = await getCookiesFromRequest();
  const user = await getUserOrNull(headers);
  if (!user) redirect("/login");
  if (!user.isStaff) redirect("/profile");

  const organizations: Organization[] = (
    await organizationList({ limit: 1000, ordering: "name" }, { headers })
  ).data.results;

  return (
    <main className="w-full max-w-[90rem] grow space-y-5 px-4 pt-10 pb-10 sm:px-6">
      <header>
        <Link className="text-sm font-semibold text-link hover:underline" href="/schedule/plan">
          ← Sendetid
        </Link>
        <h1 className="mt-1 text-4xl font-bold tracking-tight sm:text-5xl">Faste sendeflater</h1>
        <p className="mt-2 max-w-3xl text-default-600">
          Hver fast sendeflate gir organisasjonen ny sendetid hver gang den kommer igjen. Dra for å
          lage, flytte eller forlenge en sendeflate.
        </p>
      </header>
      <SlotPlanner organizations={organizations} />
    </main>
  );
}
