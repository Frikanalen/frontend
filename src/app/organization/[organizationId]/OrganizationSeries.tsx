import { ssrSeriesList } from "@/generated/ssr/series/series";
import Link from "next/link";

export const OrganizationSeries = async ({ organizationId }: { organizationId: number }) => {
  const response = await ssrSeriesList(
    { organization: organizationId, limit: 12 },
    { cache: "no-store" },
  ).catch(() => null);

  if (!response || response.status !== 200 || response.data.results.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold">Serier</h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {response.data.results.map((series) => (
          <li key={series.id}>
            <Link
              href={`/series/${series.id}`}
              className="block h-full rounded-lg border border-default-200 p-4 hover:bg-default-100"
            >
              <h3 className="font-semibold">{series.name}</h3>
              <p className="text-sm text-foreground/70">
                {series.episodeCount === 1 ? "1 episode" : `${series.episodeCount} episoder`}
              </p>
              {series.synopsis && <p className="mt-2 line-clamp-3 text-sm">{series.synopsis}</p>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};
