import { getUserOrNull } from "@/app/getUserOrNull";
import { profileIsAdminOrMember } from "@/app/organization/[organizationId]/admin/profileIsAdminOrMember";
import { SeriesManager } from "@/app/organization/[organizationId]/series/SeriesManager";
import { getCookiesFromRequest } from "@/lib/getCookiesFromRequest";
import { organizationRetrieve } from "@/generated/organization/organization";
import { forbidden, notFound, redirect } from "next/navigation";
import { OrganizationParams, parseParamsOr404 } from "@/lib/routeParams";

export default async function Page({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await parseParamsOr404(OrganizationParams, params);

  const headers = await getCookiesFromRequest();
  const user = await getUserOrNull(headers);
  if (!user) return redirect("/login");
  if (!profileIsAdminOrMember(organizationId, user)) return forbidden();

  const response = await organizationRetrieve(organizationId, { headers });
  if (response.status === 404) return notFound();
  if (response.status !== 200) throw new Error(`Kunne ikke hente organisasjon ${organizationId}`);

  return (
    <section className="space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">Serier for {response.data.name}</h1>
        <p className="text-foreground/75">Samle videoer som hører sammen.</p>
      </div>
      <SeriesManager organizationId={organizationId} />
    </section>
  );
}
