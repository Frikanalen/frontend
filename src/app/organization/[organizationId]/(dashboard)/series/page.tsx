import { getUserOrNull } from "@/app/getUserOrNull";
import { profileIsAdminOrMember } from "@/app/organization/[organizationId]/admin/profileIsAdminOrMember";
import { SeriesManager } from "@/app/organization/[organizationId]/series/SeriesManager";
import { getCookiesFromRequest } from "@/lib/getCookiesFromRequest";
import { organizationRetrieve } from "@/generated/organization/organization";
import { forbidden, notFound, redirect } from "next/navigation";
import { OrganizationParams, parseParamsOr404 } from "@/lib/routeParams";

// Per-visitor: rendered on request, without a static shell of its own.
export const instant = false;

export default async function Page({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await parseParamsOr404(OrganizationParams, params);

  const headers = await getCookiesFromRequest();
  const user = await getUserOrNull(headers);
  if (!user) return redirect("/login");
  if (!user.isStaff && !profileIsAdminOrMember(organizationId, user)) forbidden();

  const response = await organizationRetrieve(organizationId, { headers });
  if (response.status === 404) return notFound();
  if (response.status !== 200) throw new Error(`Kunne ikke hente organisasjon ${organizationId}`);

  return (
    <section>
      <SeriesManager organizationId={organizationId} />
    </section>
  );
}
