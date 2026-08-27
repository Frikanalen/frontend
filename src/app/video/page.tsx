import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense, cache } from "react";
import { ArchiveSearch } from "@/app/video/ArchiveSearch";
import { ArchiveFilters } from "@/app/video/ArchiveFilters";
import { ActiveFilters } from "@/app/video/ActiveFilters";
import { ResultsSkeleton } from "@/app/video/ResultsSkeleton";
import { SearchResults } from "@/app/video/SearchResults";
import {
  ARCHIVE_LENGTHS,
  ArchiveScope,
  ArchiveState,
  firstValue,
  parseCategory,
  parseLength,
  parseOrganization,
  parsePage,
  parseSort,
} from "@/app/video/archiveSearchUrl";
import { ssrOrganizationRetrieve } from "@/generated/ssr/organization/organization";

type ArchivePageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * Resolves `?organization=` to something showable, or to null if it names no
 * organization. Cached because the metadata and the page both need the name
 * and would otherwise ask for it twice on every request.
 */
const loadScope = cache(async (organization: number): Promise<ArchiveScope | null> => {
  const { data, status } = await ssrOrganizationRetrieve(organization, {
    cache: "no-store",
  });

  return status === 200 ? { id: data.id, name: data.name } : null;
});

/** Everything the URL says about what to show, in the shape the page passes around. */
const stateFrom = (params: Awaited<ArchivePageProps["searchParams"]>): ArchiveState => ({
  query: firstValue(params.q).trim(),
  organization: parseOrganization(params.organization),
  category: parseCategory(params.category),
  length: parseLength(params.length),
  sort: parseSort(params.sort),
  page: parsePage(params.page),
});

export async function generateMetadata({ searchParams }: ArchivePageProps): Promise<Metadata> {
  const state = stateFrom(await searchParams);
  const scope = state.organization === undefined ? null : await loadScope(state.organization);

  return {
    title: [
      state.query && `«${state.query}»`,
      scope?.name,
      state.category,
      state.length && ARCHIVE_LENGTHS[state.length].label,
      "Arkiv",
      "Frikanalen",
    ]
      .filter(Boolean)
      .join(" - "),
    description: scope
      ? `Videoer fra ${scope.name} i Frikanalens arkiv.`
      : "Søk i Frikanalens arkiv over videoer fra norsk organisasjonsliv.",
  };
}

/**
 * The archive: two and a half thousand videos, and the tools to find one.
 *
 * Laid out as a search application rather than as a landing page - a search
 * field, a rail of facets and a column of results - because that is what
 * people come here to do. The version this replaces put a wall of category
 * chips between the search box and the content, showed the twelve newest
 * videos and then stopped, and gave each result a thumbnail, a title and an
 * organization: nothing about how long a video runs, when it arrived, or what
 * it is about, which are the three things that decide whether to open it.
 *
 * Everything the page shows is in its URL - query, organization, category,
 * length band, sort, page - so every view of the archive can be linked to, and
 * every control on the page is an ordinary link that works before the client
 * bundle arrives. The search box is the one exception, and it degrades to a
 * plain GET.
 */
export default async function ArchivePage({ searchParams }: ArchivePageProps) {
  const params = await searchParams;
  const state = stateFrom(params);
  const scope = state.organization === undefined ? null : await loadScope(state.organization);

  // An id that names no organization is a 404 rather than a silently dropped
  // filter: a page headed "0 videoer" for an organization that was never
  // there reads as an empty archive rather than as a bad link.
  if (scope === null && state.organization !== undefined) return notFound();

  // A new set of narrowings gets its own fallback, rather than leaving the
  // previous page's results up while the next ones load. The sort is in the
  // key too: reordering replaces every row on screen.
  const resultsKey = [
    scope?.id ?? "",
    state.query,
    state.category,
    state.length,
    state.sort,
    state.page,
  ].join(":");

  return (
    <main className="w-full max-w-5xl grow px-2 pb-12">
      <header className="space-y-4">
        {/* An organization's name heads its own view of the archive, but the
            unnarrowed page had nothing to say beyond the word already in the
            nav, so there it is a heading for screen readers only - the page
            keeps its h1, and the rows below keep something to be nested
            under, without printing a label nobody needed. */}
        {scope ? (
          <h1 className="text-3xl font-black sm:text-4xl">{scope.name}</h1>
        ) : (
          <h1 className="sr-only">Arkiv</h1>
        )}

        <ArchiveSearch initialQuery={state.query} scope={scope ?? undefined} />

        {/*
          The rail is twenty-odd links, and it comes before the results in
          the document because that is where it is on screen - reading order
          and visual order agreeing is worth keeping. That leaves a keyboard
          user twenty Tab presses from the first result on every archive
          page, which is exactly the repeated block a bypass link is for.
          Invisible until it is focused, so it costs nothing to everyone
          else.
        */}
        <a
          href="#arkiv-resultater"
          className="sr-only rounded-lg bg-background px-4 py-2 text-small shadow-lg ring-2 ring-focus focus:not-sr-only focus:inline-block"
        >
          Hopp til resultatene
        </a>
      </header>

      {/*
        Explicit placement rather than auto-flow, so the results column is in
        the same place whether or not the filters have streamed in yet.
        Without it a suspended rail would let the results start in column
        one and jump across when it arrived.
      */}
      <div className="mt-6 grid gap-5 lg:grid-cols-[13rem_1fr] lg:gap-8">
        <div className="lg:col-start-1 lg:row-start-1 lg:sticky lg:top-6 lg:self-start">
          {/* No fallback: a rail appearing a moment late is less distracting
              than a placeholder for one, and nothing below it moves when it
              lands. */}
          <Suspense fallback={null}>
            <ArchiveFilters state={state} />
          </Suspense>
        </div>

        {/* min-w-0 so a long title can't push the column wider than its share
            of the grid - a grid item's default minimum is its content.
            tabIndex -1 so the bypass link above can move focus here, and not
            only the viewport. */}
        <div
          id="arkiv-resultater"
          tabIndex={-1}
          className="min-w-0 space-y-5 outline-hidden lg:col-start-2 lg:row-start-1"
        >
          <ActiveFilters state={state} scope={scope ?? undefined} />

          <Suspense key={resultsKey} fallback={<ResultsSkeleton />}>
            <SearchResults state={state} scope={scope ?? undefined} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
