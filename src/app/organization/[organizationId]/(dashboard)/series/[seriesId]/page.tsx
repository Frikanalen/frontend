import { getUserOrNull } from "@/app/getUserOrNull";
import { profileIsAdminOrMember } from "@/app/organization/[organizationId]/admin/profileIsAdminOrMember";
import { SeriesEditForm } from "@/app/organization/[organizationId]/series/SeriesEditForm";
import { SeriesEpisodeOrder } from "@/app/organization/[organizationId]/series/SeriesEpisodeOrder";
import { organizationRetrieve } from "@/generated/organization/organization";
import { ssrSeriesRetrieve } from "@/generated/ssr/series/series";
import { getCookiesFromRequest } from "@/lib/getCookiesFromRequest";
import Link from "next/link";
import { forbidden, notFound, redirect } from "next/navigation";
import { OrganizationSeriesParams, parseParams } from "@/lib/routeParams";

export default async function Page({
  params,
}: {
  params: Promise<{ organizationId: string; seriesId: string }>;
}) {
  const { organizationId, seriesId } = await parseParams(OrganizationSeriesParams, params);

  const headers = await getCookiesFromRequest();
  const user = await getUserOrNull(headers);
  if (!user) return redirect("/login");
  if (!profileIsAdminOrMember(organizationId, user)) return forbidden();

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
    <section className="space-y-6 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rediger {series.name}</h1>
          <p className="text-foreground/75">Oppdater serien og organiser episodene.</p>
        </div>
        <Link
          className="inline-flex h-10 items-center rounded-medium px-4 text-sm font-medium transition-colors hover:bg-default-100"
          href={`/organization/${organizationId}/series`}
        >
          Tilbake til serier
        </Link>
      </div>
      <SeriesEditForm series={series} />
      <SeriesEpisodeOrder organizationId={organizationId} seriesId={series.id} />
    </section>
  );
}
