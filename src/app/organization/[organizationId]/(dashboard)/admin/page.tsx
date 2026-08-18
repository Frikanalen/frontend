import { getCookiesFromRequest } from "@/app/profile/getCookiesFromRequest";
import { organizationRetrieve } from "@/generated/organization/organization";
import { OrgAdminPage } from "@/app/organization/[organizationId]/OrgAdminPage";
import { forbidden, notFound, redirect } from "next/navigation";
import { profileIsAdminOrMember } from "@/app/organization/[organizationId]/admin/profileIsAdminOrMember";
import { getUserOrNull } from "@/app/getUserOrNull";

export default async function Page({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  const organizationIdNum = parseInt(organizationId);
  if (isNaN(organizationIdNum)) return notFound();

  const headers = await getCookiesFromRequest();
  const user = await getUserOrNull(headers);
  if (!user) return redirect("/login");

  const orgRes = await organizationRetrieve(organizationId, { headers });
  if (orgRes.status === 404) return notFound();

  const organization = orgRes.data;
  if (!profileIsAdminOrMember(organizationIdNum, user)) throw forbidden();

  return <OrgAdminPage organization={organization} />;
}
