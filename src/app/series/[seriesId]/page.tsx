import { VideoGrid } from "@/app/video/VideoGrid";
import { ssrSeriesRetrieve } from "@/generated/ssr/series/series";
import { ssrVideosList } from "@/generated/ssr/videos/videos";
import { orderSeriesEpisodes } from "@/app/series/orderSeriesEpisodes";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type SeriesPageProps = { params: Promise<{ seriesId: string }> };

export async function generateMetadata({ params }: SeriesPageProps): Promise<Metadata> {
  const { seriesId } = await params;
  const response = await ssrSeriesRetrieve(seriesId, { cache: "no-store" });
  if (response.status !== 200 || !response.data.organization.fkmember)
    return { title: "Frikanalen" };
  return {
    title: `${response.data.name} – Frikanalen`,
    description: response.data.synopsis,
    openGraph: {
      type: "website",
      url: `https://frikanalen.no/series/${response.data.id}`,
      images: response.data.imageUrl ? [response.data.imageUrl] : undefined,
    },
  };
}

export default async function Page({ params }: SeriesPageProps) {
  const { seriesId } = await params;
  const [seriesResponse, videosResponse] = await Promise.all([
    ssrSeriesRetrieve(seriesId, { cache: "no-store" }),
    ssrVideosList(
      { series: Number(seriesId), publish_on_web: true, ordering: "id", limit: 100 },
      { cache: "no-store" },
    ),
  ]);

  if (seriesResponse.status === 404) return notFound();
  if (seriesResponse.status !== 200)
    throw new Error(`Unexpected status ${seriesResponse.status} when fetching series ${seriesId}`);
  if (!seriesResponse.data.organization.fkmember) return notFound();
  if (videosResponse.status !== 200)
    throw new Error(`Unexpected status ${videosResponse.status} when fetching series episodes`);

  const series = seriesResponse.data;
  const episodes = orderSeriesEpisodes(videosResponse.data.results);
  return (
    <article className="space-y-6 rounded-xl bg-background p-6 text-foreground shadow-lg">
      <header className="grid gap-5 md:grid-cols-[minmax(0,2fr)_minmax(14rem,1fr)]">
        <div className="prose dark:prose-invert">
          <h1>{series.name}</h1>
          {series.synopsis && <p>{series.synopsis}</p>}
          <p>
            En serie fra{" "}
            <Link href={`/organization/${series.organization.id}`}>{series.organization.name}</Link>
          </p>
        </div>
        {series.imageUrl && (
          // Artwork may live on any member-controlled HTTPS host, so Next's
          // build-time image host allowlist cannot know it in advance.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={series.imageUrl}
            alt={`Seriebilde for ${series.name}`}
            className="aspect-video w-full rounded-xl object-cover"
          />
        )}
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">Episoder</h2>
        {episodes.length ? (
          <VideoGrid videos={episodes} showOrganization={false} headingLevel={3} />
        ) : (
          <p>Denne serien har ingen publiserte episoder ennå.</p>
        )}
      </section>
    </article>
  );
}
