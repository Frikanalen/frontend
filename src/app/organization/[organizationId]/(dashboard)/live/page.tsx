import { getUserOrNull } from "@/app/getUserOrNull";
import { profileIsAdminOrMember } from "@/app/organization/[organizationId]/admin/profileIsAdminOrMember";
import {
  organizationLiveSourcesList,
  organizationRetrieve,
} from "@/generated/organization/organization";
import { getCookiesFromRequest } from "@/lib/getCookiesFromRequest";
import { OrganizationParams, parseParamsOr404 } from "@/lib/routeParams";
import { forbidden, notFound, redirect } from "next/navigation";
import { EncoderKeys } from "./EncoderKeys";
import { LiveSourcePreview } from "./LiveSourcePreview";
import { NewLiveSource } from "./NewLiveSource";

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

  // The API's rule for setting up live transmission, the same as for
  // programming airtime: a confirmed identity in a member organization.
  const maySetUp = user.isStaff || (user.identityConfirmed && organization.fkmember);

  return (
    <section className="flex flex-col gap-4">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Direktesending</h1>
        <p className="mt-2 max-w-3xl text-default-600">
          Sett opp kildene {organization.name} sender direkte fra, gi koderne nøkler, og se at
          signalet kommer fram til Frikanalen før sendingen starter. En direktesending settes opp i
          sendetiden som en video med en direktekilde.
        </p>
      </header>
      {maySetUp ? (
        <NewLiveSource organizationId={organizationId} />
      ) : (
        <p className="text-default-600">
          {organization.fkmember
            ? "Du må bekrefte identiteten din for å sette opp direktesending."
            : "Bare medlemsorganisasjoner kan sette opp direktesending selv. Ta kontakt med Frikanalen."}
        </p>
      )}
      {sources.length === 0 ? (
        <p>Organisasjonen har ingen direktekilder ennå.</p>
      ) : (
        // One source starts by itself; with several, each waits to be asked
        // so the page does not open a connection per source at once.
        sources.map((source) => (
          <LiveSourcePreview key={source.id} source={source} autoStart={sources.length === 1}>
            <EncoderKeys maySetUp={maySetUp} source={source} />
          </LiveSourcePreview>
        ))
      )}
    </section>
  );
}
