import { VideoCreateForm } from "@/app/organization/[organizationId]/create/VideoCreateForm";
import { StudioHeader } from "@/app/organization/[organizationId]/StudioHeader";
import { getCookiesFromRequest } from "@/lib/getCookiesFromRequest";
import { seriesList } from "@/generated/series/series";
import { OrganizationParams, parseParamsOr404 } from "@/lib/routeParams";

// Per-visitor: rendered on request, without a static shell of its own.
export const instant = false;

export default async function Page({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await parseParamsOr404(OrganizationParams, params);

  const headers = await getCookiesFromRequest();
  const { data: series } = await seriesList(
    { organization: organizationId, limit: 100 },
    { headers },
  );

  return (
    <section className="max-w-3xl">
      <StudioHeader
        title="Ny video"
        intro="Velg filen og gi videoen en tittel. Opplastingen starter med en gang, og dere fyller inn resten mens den pågår."
      />
      <VideoCreateForm organizationId={organizationId} series={series.results} />
    </section>
  );
}
