import { getUserOrNull } from "@/app/getUserOrNull";
import { profileIsAdminOrMember } from "@/app/organization/[organizationId]/admin/profileIsAdminOrMember";
import {
  organizationLiveSourcesList,
  organizationRetrieve,
} from "@/generated/organization/organization";
import { getCookiesFromRequest } from "@/lib/getCookiesFromRequest";
import { OrganizationParams, parseParamsOr404 } from "@/lib/routeParams";
import { forbidden, notFound, redirect } from "next/navigation";
import { LiveSourcePreview } from "./LiveSourcePreview";

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
  const sources = (await organizationLiveSourcesList(organizationId, { headers })).data;

  return (
    <section className="flex flex-col gap-4 p-4">
      <header>
        <h1 className="text-2xl font-bold">Sjekk direktesending</h1>
        <p className="mt-2 text-default-600">
          Se at signalet fra koderen til {organization.name} kommer fram til Frikanalen før
          sendingen starter.
        </p>
      </header>
      {sources.length === 0 ? (
        <p>
          Organisasjonen har ingen direktekilder. Ta kontakt med Frikanalen for å få satt opp en.
        </p>
      ) : (
        // One source starts by itself; with several, each waits to be asked
        // so the page does not open a connection per source at once.
        sources.map((source) => (
          <LiveSourcePreview key={source.id} source={source} autoStart={sources.length === 1} />
        ))
      )}
    </section>
  );
}
