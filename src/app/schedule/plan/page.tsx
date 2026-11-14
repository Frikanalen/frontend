import { getUserOrNull } from "@/app/getUserOrNull";
import { GrantsBoard } from "@/app/grants/GrantsBoard";
import { getCookiesFromRequest } from "@/lib/getCookiesFromRequest";
import type { Organization } from "@/generated/frikanalenDjangoAPI.schemas";
import { organizationList } from "@/generated/organization/organization";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import cx from "classnames";
import { PlanHeader } from "./PlanNav";
import { StaffWeek } from "./week/StaffWeek";
import { parseWeek } from "./week/week";

// Per-visitor: rendered on request, without a static shell of its own.
export const instant = false;

export const metadata: Metadata = {
  title: "Sendetid - Frikanalen",
};

const toggleClass = (active: boolean) =>
  cx(
    "px-3 py-1 text-sm font-semibold",
    active ? "bg-foreground text-background" : "text-default-600 hover:text-foreground",
  );

/**
 * Staff's airtime overview: the week as it is given out, or, with
 * ?visning=liste, the coming grants as a list.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ organization?: string; uke?: string; visning?: string }>;
}) {
  const headers = await getCookiesFromRequest();
  const user = await getUserOrNull(headers);
  if (!user) redirect("/login");

  const params = await searchParams;
  const requestedId = Number(params.organization);
  if (!user.isStaff) {
    const organizationIds = new Set([...user.memberOf, ...user.editorOf].map(({ id }) => id));
    if (Number.isFinite(requestedId) && organizationIds.has(requestedId)) {
      redirect(`/organization/${requestedId}/schedule`);
    }
    redirect("/profile");
  }

  const organizations: Organization[] = (
    await organizationList({ limit: 1000, ordering: "name" }, { headers })
  ).data.results;
  const asList = params.visning === "liste" || Number.isFinite(requestedId);

  return (
    <main className="w-full max-w-[90rem] grow space-y-5 px-4 pt-10 pb-10 sm:px-6">
      <PlanHeader title="Sendetid">
        Sendetiden som er gitt, uke for uke. Velg en sendetid for å se, endre eller slette den. Dra
        i ledig tid for å gi sendetid eller sette opp en enkelt video for en organisasjon.
      </PlanHeader>
      <div aria-label="Visning" className="inline-flex border border-default-300" role="group">
        <Link
          aria-current={!asList ? "page" : undefined}
          className={toggleClass(!asList)}
          href="/schedule/plan"
        >
          Kalender
        </Link>
        <Link
          aria-current={asList ? "page" : undefined}
          className={toggleClass(asList)}
          href="/schedule/plan?visning=liste"
        >
          Liste
        </Link>
      </div>
      {asList ? (
        <GrantsBoard
          organizations={organizations}
          organizationId={Number.isFinite(requestedId) ? requestedId : undefined}
        />
      ) : (
        <StaffWeek initialWeek={parseWeek(params.uke)} organizations={organizations} />
      )}
    </main>
  );
}
