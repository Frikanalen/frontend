import Link from "next/link";
import { ssrVideosList } from "@/generated/ssr/videos/videos";
import { VideoGrid } from "@/app/video/VideoGrid";
import { ARCHIVE_PAGE_SIZE, ArchiveScope, archiveSearchUrl } from "@/app/video/archiveSearchUrl";

const RESULTS_HEADING_ID = "archive-results";

const pageLinkClassName =
  "rounded-medium bg-background px-4 py-2 text-small shadow-sm ring-1 ring-default-300";

/**
 * One page of `/api/videos`, narrowed by a free-text query, by an
 * organization, by a category, or by any combination of them.
 *
 * No cookies are forwarded: this is the public archive, so it deliberately
 * sees what a signed-out visitor sees. `publish_on_web` matches the backend's
 * own definition of a public video, which the list endpoint doesn't apply on
 * its own.
 */
export const SearchResults = async ({
  query,
  page,
  scope,
  category = "",
}: {
  query: string;
  page: number;
  scope?: ArchiveScope;
  category?: string;
}) => {
  // A backend that is down or slow reports itself here rather than throwing
  // the whole page away: the search field above stays on screen, holding what
  // the visitor typed, so retrying costs them a keystroke instead of a
  // rewrite.
  const response = await ssrVideosList(
    {
      // Both narrowings are omitted rather than sent empty: `q=` is a search
      // for nothing rather than an absent search, and it would cost the
      // relevance ordering that a real query is ranked by.
      ...(query ? { q: query } : { ordering: "-id" }),
      ...(scope ? { organization: scope.id } : {}),
      // A repeatable parameter, and one the API validates against the real
      // categories - so an invented name comes back 400 rather than empty.
      ...(category ? { categories__name__icontains: [category] } : {}),
      publish_on_web: true,
      limit: ARCHIVE_PAGE_SIZE,
      offset: (page - 1) * ARCHIVE_PAGE_SIZE,
    },
    { cache: "no-store" },
  ).catch((error: unknown) => {
    console.error(`Archive search for "${query}" could not reach the API:`, error);
    return null;
  });

  // The category is the only narrowing here the API can reject, so a 400
  // while one is set is a name it doesn't recognise - a stale link or a
  // hand-edited URL - and saying so beats blaming the search.
  if (response?.status === 400 && category)
    return (
      <div className="space-y-4">
        <p role="alert">Kategorien «{category}» finnes ikke.</p>
        <Link
          className={pageLinkClassName}
          href={archiveSearchUrl({ query, organization: scope?.id })}
        >
          {query ? `Søk etter «${query}» i hele arkivet` : "Tilbake til arkivet"}
        </Link>
      </div>
    );

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

  const pageUrl = (target: number) =>
    archiveSearchUrl({ query, organization: scope?.id, category, page: target });

  /** Names the active narrowings, so both the count and the empty state read
   *  the same way whichever of them is set. */
  const narrowing =
    (scope ? ` fra ${scope.name}` : "") + (category ? ` i kategorien ${category}` : "");

  if (!results.length)
    return (
      <div className="space-y-4">
        <p>
          {query
            ? `Ingen videoer matcher «${query}»${narrowing}${page > 1 ? " på denne siden" : ""}.`
            : `Ingen videoer${narrowing || " i arkivet"} ennå.`}
        </p>
        {page > 1 && (
          <Link className={pageLinkClassName} href={pageUrl(1)}>
            Tilbake til første side
          </Link>
        )}
        {/*
          A search that came up empty inside one organization is very often a
          search that would land in the archive at large, so the way out is
          offered rather than left to be guessed at.
        */}
        {!!query && !!scope && (
          <Link className={pageLinkClassName} href={archiveSearchUrl({ query })}>
            Søk i hele arkivet i stedet
          </Link>
        )}
      </div>
    );

  return (
    <section aria-labelledby={RESULTS_HEADING_ID} className="space-y-6">
      {/* Unseen, but it gives the grid below a section of its own, so its
          cards can be h3 like every other grid on the page. The count under
          it can't do that job: role="status" replaces the heading role. */}
      <h2 id={RESULTS_HEADING_ID} className="sr-only">
        Søkeresultater
      </h2>

      <p role="status" className="text-sm text-foreground/75">
        {query ? `${count} treff på «${query}»` : `${count} videoer`}
        {narrowing}
        {lastPage > 1 && ` – side ${page} av ${lastPage}`}
      </p>

      <VideoGrid videos={results} showOrganization={!scope} headingLevel={3} />

      {lastPage > 1 && (
        <nav className="flex justify-between" aria-label="Sider med treff">
          {page > 1 ? (
            <Link className={pageLinkClassName} href={pageUrl(page - 1)} rel="prev">
              Forrige side
            </Link>
          ) : (
            <span />
          )}
          {page < lastPage && (
            <Link className={pageLinkClassName} href={pageUrl(page + 1)} rel="next">
              Neste side
            </Link>
          )}
        </nav>
      )}
    </section>
  );
};
