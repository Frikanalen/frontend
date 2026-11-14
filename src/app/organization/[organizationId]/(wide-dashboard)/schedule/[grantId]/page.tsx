import { getUserOrNull } from "@/app/getUserOrNull";
import { GrantEditor } from "@/app/grants/GrantEditor";
import { profileIsAdminOrMember } from "@/app/organization/[organizationId]/admin/profileIsAdminOrMember";
import { getCookiesFromRequest } from "@/lib/getCookiesFromRequest";
import { OrganizationGrantParams, parseParamsOr404 } from "@/lib/routeParams";
import { forbidden, redirect } from "next/navigation";

// Per-visitor: rendered on request, without a static shell of its own.
export const instant = false;

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ organizationId: string; grantId: string }>;
  searchParams: Promise<{ direkte?: string }>;
}) {
  const { organizationId, grantId } = await parseParamsOr404(OrganizationGrantParams, params);

  const headers = await getCookiesFromRequest();
  const user = await getUserOrNull(headers);
  if (!user) redirect("/login");
  if (!user.isStaff && !profileIsAdminOrMember(organizationId, user)) forbidden();

  // The live setup links here to book a broadcast from the source it made.
  const liveSourceId = Number((await searchParams).direkte);

  return (
    <div className="grow">
      <GrantEditor
        newLiveFrom={Number.isInteger(liveSourceId) && liveSourceId > 0 ? liveSourceId : undefined}
        backHref={user.isStaff ? "/schedule/plan?uke=" : `/organization/${organizationId}/schedule`}
        grantId={grantId}
      />
    </div>
  );
}
