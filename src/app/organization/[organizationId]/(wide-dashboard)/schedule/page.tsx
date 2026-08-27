import { getUserOrNull } from "@/app/getUserOrNull";
import { profileIsAdminOrMember } from "@/app/organization/[organizationId]/admin/profileIsAdminOrMember";
import { getCookiesFromRequest } from "@/lib/getCookiesFromRequest";
import { SchedulePlanner } from "@/app/schedule/plan/SchedulePlanner";
import { organizationRetrieve } from "@/generated/organization/organization";
import { schedulingPolicyRetrieve } from "@/generated/scheduling/scheduling";
import { forbidden, notFound, redirect } from "next/navigation";
import { OrganizationParams, parseParamsOr404 } from "@/lib/routeParams";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await parseParamsOr404(OrganizationParams, params);

  const headers = await getCookiesFromRequest();
  const user = await getUserOrNull(headers);
  if (!user) redirect("/login");
  if (!user.isStaff && !profileIsAdminOrMember(organizationId, user)) forbidden();

  const organizationResponse = await organizationRetrieve(organizationId, { headers });
  if (organizationResponse.status === 404) notFound();
  const organization = organizationResponse.data;
  const policy = (await schedulingPolicyRetrieve()).data;

  return (
    <div className="grow space-y-5 rounded-lg p-4">
      <header>
        <h1 className="text-3xl font-bold">Programmer sendeplanen</h1>
        <p className="mt-2 text-default-600">for {organization.name}</p>
        <Link className="mt-2 inline-block text-primary-700 underline" href="/schedule/plan/rules">
          Les reglene for sendeplanlegging
        </Link>
      </header>

      {!user.identityConfirmed && !user.isStaff ? (
        <section className="rounded-xl border border-warning-300 bg-warning-50 p-5 dark:bg-warning-950">
          <h2 className="text-xl font-semibold">Identiteten din er ikke bekreftet</h2>
          <p className="mt-2">
            Frikanalen må bekrefte identiteten din før du kan programmere sendinger.
          </p>
        </section>
      ) : !organization.fkmember && !user.isStaff ? (
        <section className="rounded-xl border border-warning-300 bg-warning-50 p-5 dark:bg-warning-950">
          <h2 className="text-xl font-semibold">Organisasjonen kan ikke programmere ennå</h2>
          <p className="mt-2">Organisasjonen må ha aktivt medlemskap i Frikanalen.</p>
        </section>
      ) : (
        <SchedulePlanner organizations={[organization]} policy={policy} isStaff={user.isStaff} />
      )}
    </div>
  );
}
