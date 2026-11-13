import { getUserOrNull } from "@/app/getUserOrNull";
import { profileIsAdminOrMember } from "@/app/organization/[organizationId]/admin/profileIsAdminOrMember";
import { organizationLiveSourcesList } from "@/generated/organization/organization";
import { getCookiesFromRequest } from "@/lib/getCookiesFromRequest";
import { OrganizationLiveSourceParams, parseParamsOr404 } from "@/lib/routeParams";
import { forbidden, notFound, redirect } from "next/navigation";

/** One of an organization's live sources, for a member of it or staff. */
export const loadSource = async (params: Promise<{ organizationId: string; sourceId: string }>) => {
  const { organizationId, sourceId } = await parseParamsOr404(OrganizationLiveSourceParams, params);
  const headers = await getCookiesFromRequest();
  const user = await getUserOrNull(headers);
  if (!user) redirect("/login");
  if (!user.isStaff && !profileIsAdminOrMember(organizationId, user)) forbidden();
  // From the organization's list, which carries each source's bookings.
  const response = await organizationLiveSourcesList(organizationId, { headers });
  const source =
    response.status === 200 ? response.data.find(({ id }) => id === sourceId) : undefined;
  if (!source) notFound();
  return { organizationId, source };
};
