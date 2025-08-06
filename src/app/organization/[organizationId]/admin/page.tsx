import { getCookiesFromRequest } from "@/app/profile/getCookiesFromRequest";
import { organizationRetrieve } from "@/generated/organization/organization";
import { userRetrieve } from "@/generated/user/user";
import { OrgAdminPage } from "@/app/organization/[organizationId]/OrgAdminPage";
import { forbidden, notFound, unauthorized } from "next/navigation";
import { profileIsAdminOrMember } from "@/app/organization/[organizationId]/admin/profileIsAdminOrMember";

export default async function Page({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  const headers = await getCookiesFromRequest();
  const orgRes = await organizationRetrieve(organizationId, { headers });
  const profileRes = await userRetrieve({ headers });

  if (orgRes.status === 404) return notFound();
  if (profileRes.status === 401) return unauthorized();

  const organization = orgRes.data;
  const profile = profileRes.data;

  if (!profileIsAdminOrMember(organizationId, profile)) throw forbidden();

  return <OrgAdminPage organization={organization} profile={profile} />;
}
