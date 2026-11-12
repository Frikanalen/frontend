import { getUserOrNull } from "@/app/getUserOrNull";
import { GrantEditor } from "@/app/grants/GrantEditor";
import { profileIsAdminOrMember } from "@/app/organization/[organizationId]/admin/profileIsAdminOrMember";
import { getCookiesFromRequest } from "@/lib/getCookiesFromRequest";
import { OrganizationGrantParams, parseParamsOr404 } from "@/lib/routeParams";
import { forbidden, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ organizationId: string; grantId: string }>;
}) {
  const { organizationId, grantId } = await parseParamsOr404(OrganizationGrantParams, params);

  const headers = await getCookiesFromRequest();
  const user = await getUserOrNull(headers);
  if (!user) redirect("/login");
  if (!user.isStaff && !profileIsAdminOrMember(organizationId, user)) forbidden();

  return (
    <div className="grow">
      <GrantEditor
        backHref={user.isStaff ? "/schedule/plan" : `/organization/${organizationId}/schedule`}
        grantId={grantId}
      />
    </div>
  );
}
