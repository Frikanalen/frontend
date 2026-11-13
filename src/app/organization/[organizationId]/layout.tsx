import { ReactNode } from "react";
import { getCookiesFromRequest } from "@/lib/getCookiesFromRequest";
import { getUserOrNull } from "@/app/getUserOrNull";
import { profileIsAdminOrMember } from "@/app/organization/[organizationId]/admin/profileIsAdminOrMember";
import { loadOrganization } from "@/app/organization/[organizationId]/loadOrganization";
import { StudioNav } from "@/app/organization/[organizationId]/StudioNav";

/**
 * Everything under an organisation. Its members get the studio bar above the
 * page: one fixed place for the tools, so that Sendetid, Direktesending and
 * the rest are a menu rather than a row of buttons on one of the pages.
 * Visitors to the public profile see no bar at all.
 */
export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ organizationId: string }>;
}) {
  const organizationId = Number((await params).organizationId);
  const headers = await getCookiesFromRequest();
  const user = await getUserOrNull(headers);
  const inStudio =
    Number.isInteger(organizationId) &&
    !!user &&
    (user.isStaff || profileIsAdminOrMember(organizationId, user));

  // Shown until Frikanalen has approved both the organization and the user:
  // after that the road in is behind them and the bar is for daily work.
  let showStart = false;
  if (inStudio) {
    const organization = await loadOrganization(organizationId).catch(() => null);
    showStart =
      organization?.status === 200 &&
      (!organization.data.fkmember || !(user.identityConfirmed || user.isStaff));
  }

  return (
    <>
      {inStudio ? <StudioNav organizationId={organizationId} showStart={showStart} /> : null}
      {children}
    </>
  );
}
