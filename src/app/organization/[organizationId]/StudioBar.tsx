import { getUserOrNull } from "@/app/getUserOrNull";
import { profileIsAdminOrMember } from "@/app/organization/[organizationId]/admin/profileIsAdminOrMember";
import { loadOrganization } from "@/app/organization/[organizationId]/loadOrganization";
import { grantsNeedingProgramme } from "@/app/organization/[organizationId]/studioAttention";
import { StudioNav, type StudioSection } from "@/app/organization/[organizationId]/StudioNav";
import { ssrGrantsList } from "@/generated/ssr/grants/grants";
import { ssrOrganizationAffidavitList } from "@/generated/ssr/organization/organization";
import { MembershipBanner } from "@/app/organization/[organizationId]/MembershipBanner";
import { latestAffidavitState } from "@/app/organization/[organizationId]/affidavit/latestAffidavitState";
import { getCookiesFromRequest } from "@/lib/getCookiesFromRequest";

/**
 * The studio bar for one organization, for those who work in it: its members,
 * its editor and staff. Everyone else gets nothing. Used by the organization's
 * own pages and by the video pages that belong to its Studio (edit, upload),
 * which live under /video and would otherwise drop out of it.
 */
export const StudioBar = async ({
  organizationId,
  section,
}: {
  organizationId: number;
  /** For pages outside /organization/<id> that belong to one of its tabs. */
  section?: StudioSection;
}) => {
  if (!Number.isInteger(organizationId)) return null;
  const headers = await getCookiesFromRequest();
  const user = await getUserOrNull(headers);
  if (!user || !(user.isStaff || profileIsAdminOrMember(organizationId, user))) return null;

  const organization = await loadOrganization(organizationId).catch(() => null);
  if (organization?.status !== 200) return null;
  // Shown until Frikanalen has received the editor's declaration and approved
  // the membership: after that the road in is behind them and the bar is for
  // daily work.
  const showStart = !organization.data.fkmember;

  // Grants starting from now; the badge only needs the next few days, and a
  // failure to fetch them is no reason to leave the bar out.
  const grants = organization.data.fkmember
    ? await ssrGrantsList(
        { organization: organizationId, starts_after: new Date().toISOString(), limit: 50 },
        { headers, cache: "no-store" },
      ).catch(() => null)
    : null;
  const scheduleAttention =
    grants?.status === 200 ? grantsNeedingProgramme(grants.data.results) : 0;

  // Until then, every Studio page says what is left: the tab is easy to miss.
  const affidavits = showStart
    ? await ssrOrganizationAffidavitList(organizationId, { headers, cache: "no-store" }).catch(
        () => null,
      )
    : null;

  return (
    <>
      <StudioNav
        organizationId={organizationId}
        organizationName={organization.data.name}
        scheduleAttention={scheduleAttention}
        section={section}
        showStart={showStart}
      />
      {showStart ? (
        <MembershipBanner
          organizationId={organizationId}
          state={affidavits?.status === 200 ? latestAffidavitState(affidavits.data) : "none"}
        />
      ) : null}
    </>
  );
};
