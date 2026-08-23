import Link from "next/link";
import { ssrVideosList } from "@/generated/ssr/videos/videos";
import { VideoList } from "@/app/video/VideoList";
import { ArchivePagination } from "@/app/video/ArchivePagination";
import {
  ARCHIVE_LENGTHS,
  ARCHIVE_PAGE_SIZE,
  ARCHIVE_SORTS,
  ArchiveScope,
  ArchiveState,
  archiveSearchUrl,
  resolveSort,
} from "@/app/video/archiveSearchUrl";

const RESULTS_HEADING_ID = "archive-results";

const wayOutClassName =
  "inline-flex rounded-lg bg-background px-4 py-2 text-small shadow-sm ring-1 ring-default-300 outline-hidden hover:bg-content1 focus-visible:ring-2 focus-visible:ring-focus";

/**
 * One page of `/api/videos`, narrowed by a free-text query, an organization, a
 * category and a length band in any combination, and read in whichever order
 * was asked for.
 *
 * This is now the only way the archive lists anything. It used to share the
 * page with a separate "twelve newest" component that ran whenever nothing
 * narrowed the archive - a second code path, with its own fetch and its own
 * empty state, that dead-ended after twelve videos with no way further in.
 * Unnarrowed is just the whole archive sorted newest-first, so it goes through
 * here like every other view and paginates like every other view.
 *
 * No cookies are forwarded: this is the public archive, so it deliberately
 * sees what a signed-out visitor sees. `publish_on_web` matches the backend's
 * own definition of a public video, which the list endpoint doesn't apply on
 * its own.
 */
export const SearchResults = async ({
  state,
  scope,
}: {
  state: ArchiveState;
  scope?: ArchiveScope;
}) => {
  const { query, category, length, page } = state;
  const sort = resolveSort(state.sort, Boolean(query));

  // A backend that is down or slow reports itself here rather than throwing
  // the whole page away: the search field and the filters above stay on
  // screen, holding what the visitor asked for, so retrying costs them a
  // keystroke instead of a rewrite.
  const response = await ssrVideosList(
    {
      // Omitted rather than sent empty: `q=` is a search for nothing rather
      // than an absent search, and it would cost the relevance ordering that
      // a real query is ranked by.
      ...(query ? { q: query } : {}),
      ...(scope ? { organization: scope.id } : {}),
      // A repeatable parameter, and one the API validates against the real
      // categories - so an invented name comes back 400 rather than empty.
      ...(category ? { categories__name__icontains: [category] } : {}),
      ...(length ? ARCHIVE_LENGTHS[length].params : {}),
      // Absent for relevance, which is the API's own ranking of a free-text
      // search and has no field to sort by.
      ...(ARCHIVE_SORTS[sort].ordering ? { ordering: ARCHIVE_SORTS[sort].ordering } : {}),
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
          className={wayOutClassName}
          href={archiveSearchUrl({ ...state, category: "", page: 1 })}
        >
          {query ? `Søk etter «${query}» uten den` : "Tilbake til arkivet"}
        </Link>
      </div>
    );

  if (response?.status !== 200)
    return (
      <p
        role="alert"
        className="rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-small text-danger-700"
      >
        Søket lot seg ikke gjennomføre. Prøv igjen om litt.
      </p>
    );

  const { count, results } = response.data;
  const lastPage = Math.max(1, Math.ceil(count / ARCHIVE_PAGE_SIZE));

  if (!results.length)
    return (
      <div className="space-y-4">
        <p className="text-large">
          {query ? `Ingen videoer matcher «${query}».` : "Ingen videoer her."}
        </p>

        {/* The narrowings are drawn as removable chips directly above this, so
            the way out is to point at them rather than to reprint them as a
            second set of links that would drift out of step with the first. */}
        {(!!category || !!length || !!scope) && (
          <p className="text-foreground/75">Prøv å fjerne et av filtrene over.</p>
        )}

        <div className="flex flex-wrap gap-2">
          {page > 1 && (
            <Link className={wayOutClassName} href={archiveSearchUrl({ ...state, page: 1 })}>
              Tilbake til første side
            </Link>
          )}
          {(!!query || !!category || !!length || !!scope) && (
            <Link className={wayOutClassName} href={archiveSearchUrl({})}>
              Se hele arkivet
            </Link>
          )}
        </div>
      </div>
    );

  return (
    // A surface for the results column alone, rather than the page-wide box
    // this replaces. The count, the rows and the pagination are the text that
    // needs it: straight on the body's radial gradient the secondary lines
    // among them land at 3.8:1 in the dark theme, under the 4.5:1 normal text
    // needs. The rows keep their own opaque hover and focus backgrounds, so
    // they still read as distinct surfaces sitting on this one.
    //
    // The wash goes the way the theme does. Translucent black is what the dark
    // theme wants - it deepens the ground behind pale text - but in the light
    // theme the text is dark, and the same black pulls the panel toward the
    // text rather than away from it: 3.0:1 on those secondary lines, worse
    // than no surface at all. White does there what black does here.
    <section
      aria-labelledby={RESULTS_HEADING_ID}
      className="space-y-4 rounded-2xl bg-white/60 p-3 sm:p-4 dark:bg-black/30"
    >
      {/* Unseen, but it gives the list below a section of its own, so its rows
          can be h3 like every other list on the page. The count under it can't
          do that job: role="status" replaces the heading role. */}
      <h2 id={RESULTS_HEADING_ID} className="sr-only">
        Søkeresultater
      </h2>

      {/*
        The first thing a reader looks for after searching, and previously the
        least prominent thing on the page - twelve-pixel grey text under a wall
        of chips. It is now the largest text in the results column, and it says
        where in the pages the reader is, which the old Forrige/Neste pair
        never did.
      */}
      <p role="status" className="text-large">
        <strong className="font-bold tabular-nums">{count.toLocaleString("nb-NO")}</strong>{" "}
        {query ? `treff på «${query}»` : count === 1 ? "video" : "videoer"}
        {lastPage > 1 && (
          <span className="text-foreground/75">
            {" "}
            · side {page} av {lastPage}
          </span>
        )}
      </p>

      <VideoList videos={results} showOrganization={!scope} />

      <ArchivePagination state={state} lastPage={lastPage} />
    </section>
  );
};
