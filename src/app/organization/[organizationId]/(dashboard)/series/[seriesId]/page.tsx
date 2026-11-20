import { getUserOrNull } from "@/app/getUserOrNull";
import { profileIsAdminOrMember } from "@/app/organization/[organizationId]/admin/profileIsAdminOrMember";
import { SeriesEditForm } from "@/app/organization/[organizationId]/series/SeriesEditForm";
import { SeriesEpisodeOrder } from "@/app/organization/[organizationId]/series/SeriesEpisodeOrder";
import { organizationRetrieve } from "@/generated/organization/organization";
import { ssrSeriesRetrieve } from "@/generated/ssr/series/series";
import { getCookiesFromRequest } from "@/lib/getCookiesFromRequest";
import Link from "next/link";
import { StudioHeader } from "@/app/organization/[organizationId]/StudioHeader";
import { forbidden, notFound, redirect } from "next/navigation";
import { OrganizationSeriesParams, parseParamsOr404 } from "@/lib/routeParams";

// Per-visitor: rendered on request, without a static shell of its own.
export const instant = false;

export default async function Page({
  params,
}: {
  params: Promise<{ organizationId: string; seriesId: string }>;
}) {
  const { organizationId, seriesId } = await parseParamsOr404(OrganizationSeriesParams, params);

  const headers = await getCookiesFromRequest();
  const user = await getUserOrNull(headers);
  if (!user) return redirect("/login");
  if (!user.isStaff && !profileIsAdminOrMember(organizationId, user)) forbidden();

  const [organizationResponse, seriesResponse] = await Promise.all([
    organizationRetrieve(organizationId, { headers }),
    ssrSeriesRetrieve(seriesId, { headers, cache: "no-store" }),
  ]);
  if (organizationResponse.status === 404 || seriesResponse.status === 404) return notFound();
  if (organizationResponse.status !== 200)
    throw new Error(`Kunne ikke hente organisasjon ${organizationId}`);
  if (seriesResponse.status !== 200) throw new Error(`Kunne ikke hente serie ${seriesId}`);
  if (seriesResponse.data.organization.id !== organizationId) return notFound();

  const series = seriesResponse.data;

  return (
    <section className="space-y-6">
      <StudioHeader
        title={series.name}
        back={{ href: `/organization/${organizationId}/series`, label: "Serier" }}
        action={
          <Link className="font-semibold text-link hover:underline" href={`/series/${series.id}`}>
            Se offentlig side ↗
          </Link>
        }
      />
      <SeriesEditForm series={series} />
      <SeriesEpisodeOrder organizationId={organizationId} seriesId={series.id} />
    </section>
  );
}
