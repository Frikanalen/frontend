import { getUserOrNull } from "@/app/getUserOrNull";
import { profileIsAdminOrMember } from "@/app/organization/[organizationId]/admin/profileIsAdminOrMember";
import {
  organizationLiveSourcesList,
  organizationRetrieve,
} from "@/generated/organization/organization";
import { getCookiesFromRequest } from "@/lib/getCookiesFromRequest";
import { OrganizationParams, parseParamsOr404 } from "@/lib/routeParams";
import { forbidden, notFound, redirect } from "next/navigation";
import Link from "next/link";
import { LiveSources } from "./LiveSources";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{ oppsett?: string }>;
}) {
  const { organizationId } = await parseParamsOr404(OrganizationParams, params);

  const headers = await getCookiesFromRequest();
  const user = await getUserOrNull(headers);
  if (!user) redirect("/login");
  if (!user.isStaff && !profileIsAdminOrMember(organizationId, user)) forbidden();

  const organizationResponse = await organizationRetrieve(organizationId, { headers });
  if (organizationResponse.status === 404) notFound();
  const organization = organizationResponse.data;
  const sources = (await organizationLiveSourcesList(organizationId, { headers })).data;

  // The API's rule for setting up live transmission, the same as for
  // programming airtime: a confirmed identity in a member organization.
  const maySetUp = user.isStaff || (user.identityConfirmed && organization.fkmember);

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Direktesending</h1>
        <p className="mt-2 max-w-3xl text-default-600">
          En direktekilde er et sted {organization.name} sender direkte fra. Sett den opp én gang,
          se at signalet kommer fram, og legg sendingen i sendetiden.
        </p>
      </header>
      {maySetUp ? null : (
        <p className="border-l-4 border-warning bg-background p-4" role="note">
          {organization.fkmember
            ? "Du må få identiteten din bekreftet før du kan sette opp direktesending. "
            : "Bare medlemsorganisasjoner kan sette opp direktesending. "}
          <Link
            className="font-semibold text-link hover:underline"
            href={`/organization/${organizationId}/start`}
          >
            Se hva som gjenstår →
          </Link>
        </p>
      )}
      <LiveSources
        maySetUp={maySetUp}
        openSetup={Number((await searchParams).oppsett) || undefined}
        organizationId={organizationId}
        sources={sources}
      />
    </section>
  );
}
