import { getUserOrNull } from "@/app/getUserOrNull";
import { profileIsAdminOrMember } from "@/app/organization/[organizationId]/admin/profileIsAdminOrMember";
import { getCookiesFromRequest } from "@/lib/getCookiesFromRequest";
import { organizationRetrieve } from "@/generated/organization/organization";
import { forbidden, notFound, redirect } from "next/navigation";
import { OrganizationParams, parseParamsOr404 } from "@/lib/routeParams";
import Link from "next/link";
import { RequestPage } from "@/app/requests/RequestPage";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await parseParamsOr404(OrganizationParams, params);
  const headers = await getCookiesFromRequest();
  const user = await getUserOrNull(headers);
  if (!user) redirect("/login");
  if (!user.isStaff && !profileIsAdminOrMember(organizationId, user)) forbidden();

  const response = await organizationRetrieve(organizationId, { headers });
  if (response.status === 404) notFound();
  const organization = response.data;

  // Why this organization can't ask, if it can't; the API says the same.
  const blocked = organization.isRogue
    ? "Organisasjonen er suspendert og kan ikke be om sendetid."
    : !organization.fkmember
      ? "Organisasjonen må være godkjent som medlem av Frikanalen før den kan be om sendetid."
      : !user.identityConfirmed && !user.isStaff
        ? "Frikanalen må bekrefte identiteten din før du kan be om sendetid."
        : null;

  return (
    <div className="grow space-y-5 pb-10">
      <header>
        <Link
          className="text-sm font-semibold text-link hover:underline"
          href={`/organization/${organizationId}/schedule`}
        >
          ← Sendetid
        </Link>
        <h1 className="mt-1 text-4xl font-bold tracking-tight sm:text-5xl">Be om sendetid</h1>
        <p className="mt-2 text-default-600">for {organization.name}</p>
        <p className="mt-2 max-w-3xl">
          Be om en fast sendeflate hver uke, eller sendetid én gang. Uken under viser hva som
          allerede er tatt.
        </p>
      </header>
      <RequestPage blocked={blocked} organizationId={organizationId} />
    </div>
  );
}
