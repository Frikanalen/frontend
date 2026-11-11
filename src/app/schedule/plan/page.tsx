import { getUserOrNull } from "@/app/getUserOrNull";
import { GrantsBoard } from "@/app/grants/GrantsBoard";
import { getCookiesFromRequest } from "@/lib/getCookiesFromRequest";
import type { Organization } from "@/generated/frikanalenDjangoAPI.schemas";
import { organizationList } from "@/generated/organization/organization";
import { redirect } from "next/navigation";
import Link from "next/link";

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

  const organizations: Organization[] = (
    await organizationList({ limit: 1000, ordering: "name" }, { headers })
  ).data.results;

  return (
    <main className="w-full max-w-7xl grow space-y-5 px-3 py-4">
      <header>
        <h1 className="text-3xl font-bold">Sendetid</h1>
        <p className="mt-2 text-default-600">
          Tildelt sendetid for alle organisasjoner. Ny sendetid, avlysning og unntak fra låsing
          gjøres foreløpig i administrasjonen.
        </p>
        <Link className="mt-2 inline-block text-primary-700 underline" href="/schedule/plan/rules">
          Les hvordan sendetid virker
        </Link>
      </header>
      <GrantsBoard
        organizations={organizations}
        organizationId={Number.isFinite(requestedId) ? requestedId : undefined}
      />
    </main>
  );
}
