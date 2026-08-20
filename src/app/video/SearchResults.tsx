import Link from "next/link";
import { ssrVideosList } from "@/generated/ssr/videos/videos";
import { VideoGrid } from "@/app/video/VideoGrid";
import { ARCHIVE_PAGE_SIZE, archiveSearchUrl } from "@/app/video/archiveSearchUrl";

const pageLinkClassName =
  "rounded-medium bg-background px-4 py-2 text-small shadow-sm ring-1 ring-default-300";

/**
 * One page of `/api/videos?q=`, which ranks by relevance rather than date.
 *
 * No cookies are forwarded: this is the public archive, so it deliberately
 * sees what a signed-out visitor sees. `publish_on_web` matches the backend's
 * own definition of a public video, which the list endpoint doesn't apply on
 * its own.
 */
export const SearchResults = async ({ query, page }: { query: string; page: number }) => {
  // A backend that is down or slow reports itself here rather than throwing
  // the whole page away: the search field above stays on screen, holding what
  // the visitor typed, so retrying costs them a keystroke instead of a
  // rewrite.
  const response = await ssrVideosList(
    {
      q: query,
      publish_on_web: true,
      limit: ARCHIVE_PAGE_SIZE,
      offset: (page - 1) * ARCHIVE_PAGE_SIZE,
    },
    { cache: "no-store" },
  ).catch((error: unknown) => {
    console.error(`Archive search for "${query}" could not reach the API:`, error);
    return null;
  });

  if (response?.status !== 200)
    return (
      <p
        role="alert"
        className="rounded-medium border border-danger-200 bg-danger-50 px-3 py-2 text-small text-danger-700"
      >
        Søket lot seg ikke gjennomføre. Prøv igjen om litt.
      </p>
    );

  const { data } = response;

  const { count, results } = data;
  const lastPage = Math.max(1, Math.ceil(count / ARCHIVE_PAGE_SIZE));

  if (!results.length)
    return (
      <div className="space-y-4">
        <p>
          Ingen videoer matcher «{query}»{page > 1 && " på denne siden"}.
        </p>
        {page > 1 && (
          <Link className={pageLinkClassName} href={archiveSearchUrl(query)}>
            Tilbake til første side
          </Link>
        )}
      </div>
    );

  return (
    <div className="space-y-6">
      <p role="status" className="text-sm text-foreground/75">
        {count} treff på «{query}»{lastPage > 1 && ` – side ${page} av ${lastPage}`}
      </p>

      <VideoGrid videos={results} />

      {lastPage > 1 && (
        <nav className="flex justify-between" aria-label="Sider med treff">
          {page > 1 ? (
            <Link className={pageLinkClassName} href={archiveSearchUrl(query, page - 1)} rel="prev">
              Forrige side
            </Link>
          ) : (
            <span />
          )}
          {page < lastPage && (
            <Link className={pageLinkClassName} href={archiveSearchUrl(query, page + 1)} rel="next">
              Neste side
            </Link>
          )}
        </nav>
      )}
    </div>
  );
};
