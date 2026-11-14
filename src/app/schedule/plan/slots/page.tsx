import { getUserOrNull } from "@/app/getUserOrNull";
import { getCookiesFromRequest } from "@/lib/getCookiesFromRequest";
import type { Organization } from "@/generated/frikanalenDjangoAPI.schemas";
import { organizationList } from "@/generated/organization/organization";
import type { Metadata } from "next";
import { PlanHeader } from "../PlanNav";
import { redirect } from "next/navigation";
import { SlotPlanner } from "./SlotPlanner";

// Per-visitor: rendered on request, without a static shell of its own.
export const instant = false;

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
      <PlanHeader title="Faste sendeflater">
        Hver fast sendeflate gir organisasjonen ny sendetid hver gang den kommer igjen. Dra for å
        lage, flytte eller forlenge en sendeflate.
      </PlanHeader>
      <SlotPlanner organizations={organizations} />
    </main>
  );
}
