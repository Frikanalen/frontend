import { getUserOrNull } from "@/app/getUserOrNull";
import { getCookiesFromRequest } from "@/lib/getCookiesFromRequest";
import type { Organization } from "@/generated/frikanalenDjangoAPI.schemas";
import { organizationList } from "@/generated/organization/organization";
import { schedulingPolicyRetrieve } from "@/generated/scheduling/scheduling";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SchedulePlanner } from "./SchedulePlanner";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ organization?: string }>;
}) {
  const headers = await getCookiesFromRequest();
  const user = await getUserOrNull(headers);
  if (!user) redirect("/login");

  const requestedId = Number((await searchParams).organization);
  if (!user.isStaff) {
    const organizationIds = new Set([...user.memberOf, ...user.editorOf].map(({ id }) => id));
    if (Number.isFinite(requestedId) && organizationIds.has(requestedId)) {
      redirect(`/organization/${requestedId}/schedule`);
    }
    redirect("/profile");
  }

  const policy = (await schedulingPolicyRetrieve()).data;
  const organizations: Organization[] = (
    await organizationList({ limit: 1000, ordering: "name" }, { headers })
  ).data.results;

  return (
    <main className="w-full max-w-7xl grow space-y-5 px-3 py-4">
      <header>
        <h1 className="text-3xl font-bold">Programmer sendeplanen</h1>
        <p className="mt-2 text-default-600">
          Velg en ledig tid eller erstatt jukeboksinnhold i den åpne sendeuken.
        </p>
        <Link className="mt-2 inline-block text-primary-700 underline" href="/schedule/plan/rules">
          Les reglene for sendeplanlegging
        </Link>
      </header>

      {organizations.length === 0 ? (
        <section className="rounded-xl border border-warning-300 bg-warning-50 p-5 dark:bg-warning-950">
          <h2 className="text-xl font-semibold">Ingen organisasjon kan programmere ennå</h2>
          <p className="mt-2">
            Du må være medlem eller redaktør i en organisasjon med aktivt medlemskap i Frikanalen.
          </p>
        </section>
      ) : (
        <SchedulePlanner
          organizations={organizations}
          policy={policy}
          initialOrganizationId={Number.isFinite(requestedId) ? requestedId : undefined}
          isStaff={user.isStaff}
          showOrganizationSelector
        />
      )}
    </main>
  );
}
