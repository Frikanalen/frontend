import { getUserOrNull } from "@/app/getUserOrNull";
import { GrantsBoard } from "@/app/grants/GrantsBoard";
import { profileIsAdminOrMember } from "@/app/organization/[organizationId]/admin/profileIsAdminOrMember";
import { getCookiesFromRequest } from "@/lib/getCookiesFromRequest";
import { organizationRetrieve } from "@/generated/organization/organization";
import { forbidden, notFound, redirect } from "next/navigation";
import { OrganizationParams, parseParamsOr404 } from "@/lib/routeParams";
import Link from "next/link";
import { ButtonLink } from "@/components/ButtonLink";
import { StudioHeader } from "@/app/organization/[organizationId]/StudioHeader";

// Per-visitor: rendered on request, without a static shell of its own.
export const instant = false;

export default async function Page({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await parseParamsOr404(OrganizationParams, params);

  const headers = await getCookiesFromRequest();
  const user = await getUserOrNull(headers);
  if (!user) redirect("/login");
  if (!user.isStaff && !profileIsAdminOrMember(organizationId, user)) forbidden();

  const organizationResponse = await organizationRetrieve(organizationId, { headers });
  if (organizationResponse.status === 404) notFound();
  const organization = organizationResponse.data;

  return (
    <div className="grow space-y-5">
      <StudioHeader
        title="Sendetid"
        intro="Her er sendetiden Frikanalen har gitt dere. Sett opp hva som skal sendes i hver av dem før fristen."
        action={
          <>
            <Link className="font-semibold text-link hover:underline" href="/schedule/plan/rules">
              Slik virker sendetid
            </Link>
            <ButtonLink href={`/organization/${organization.id}/schedule/request`}>
              Be om mer sendetid
            </ButtonLink>
          </>
        }
      />

      {!user.identityConfirmed && !user.isStaff ? (
        <section className="border-l-4 border-warning bg-background p-5">
          <h2 className="text-xl font-semibold">Identiteten din er ikke bekreftet</h2>
          <p className="mt-2">
            Frikanalen må bekrefte identiteten din før du kan sette opp sendinger.
          </p>
        </section>
      ) : null}

      <GrantsBoard organizationId={organization.id} />
    </div>
  );
}
