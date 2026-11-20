import type { Metadata } from "next";
import Link from "next/link";
import { forbidden, notFound, redirect } from "next/navigation";
import { getUserOrNull } from "@/app/getUserOrNull";
import { profileIsAdminOrMember } from "@/app/organization/[organizationId]/admin/profileIsAdminOrMember";
import { StudioHeader } from "@/app/organization/[organizationId]/StudioHeader";
import { OrganizationProfileForm } from "@/app/organization/[organizationId]/(dashboard)/profile/OrganizationProfileForm";
import { ssrOrganizationRetrieve } from "@/generated/ssr/organization/organization";
import { getCookiesFromRequest } from "@/lib/getCookiesFromRequest";
import { OrganizationParams, parseParamsOr404 } from "@/lib/routeParams";

// Per-visitor: rendered on request, without a static shell of its own.
export const instant = false;

export const metadata: Metadata = { title: "Organisasjon - Frikanalen" };

/**
 * What the organization says about itself on its public page, and who
 * answers for it. The editor changes it; members see it as it stands.
 */
export default async function Page({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await parseParamsOr404(OrganizationParams, params);
  const headers = await getCookiesFromRequest();
  const user = await getUserOrNull(headers);
  if (!user) redirect("/login");
  if (!user.isStaff && !profileIsAdminOrMember(organizationId, user)) forbidden();

  const response = await ssrOrganizationRetrieve(organizationId, { headers, cache: "no-store" });
  if (response.status !== 200) notFound();
  const organization = response.data;
  // The API's rule: the editor and staff change the organization.
  const mayEdit = user.isStaff || organization.editorId === user.id;

  return (
    <section>
      <StudioHeader
        title="Organisasjon"
        intro="Slik presenteres organisasjonen for seerne. Redaktørens navn og e-post er offentlige, slik kringkastingsloven krever."
        action={
          <Link
            className="font-semibold text-link hover:underline"
            href={`/organization/${organizationId}`}
          >
            Se den offentlige siden ↗
          </Link>
        }
      />
      <OrganizationProfileForm organization={organization} mayEdit={mayEdit} />
    </section>
  );
}
