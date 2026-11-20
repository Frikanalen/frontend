import { ReactNode } from "react";
import { getCookiesFromRequest } from "@/lib/getCookiesFromRequest";
import { getUserOrNull } from "@/app/getUserOrNull";
import { profileIsAdminOrMember } from "@/app/organization/[organizationId]/admin/profileIsAdminOrMember";
import { loadOrganization } from "@/app/organization/[organizationId]/loadOrganization";
import { StudioNav } from "@/app/organization/[organizationId]/StudioNav";
import {
  MembershipBanner,
  type MembershipBannerState,
} from "@/app/organization/[organizationId]/MembershipBanner";
import { latestAffidavitState } from "@/app/organization/[organizationId]/affidavit/latestAffidavitState";
import { ssrOrganizationAffidavitList } from "@/generated/ssr/organization/organization";

// Per-visitor: rendered on request, without a static shell of its own.
export const instant = false;

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

  // Shown until Frikanalen has received the editor's declaration and approved
  // the membership: after that the road in is behind them and the bar is for
  // daily work.
  let showStart = false;
  if (inStudio) {
    const organization = await loadOrganization(organizationId).catch(() => null);
    showStart = organization?.status === 200 && !organization.data.fkmember;
  }
  let affidavit: MembershipBannerState = "none";
  if (showStart) {
    const response = await ssrOrganizationAffidavitList(organizationId, {
      headers,
      cache: "no-store",
    }).catch(() => null);
    if (response?.status === 200) affidavit = latestAffidavitState(response.data);
  }

  return (
    <>
      {inStudio ? <StudioNav organizationId={organizationId} showStart={showStart} /> : null}
      {showStart ? <MembershipBanner organizationId={organizationId} state={affidavit} /> : null}
      {children}
    </>
  );
}
