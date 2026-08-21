import { GoChevronDown, GoFilter } from "react-icons/go";
import { ssrCategoriesList } from "@/generated/ssr/categories/categories";
import { ArchiveCategory, ArchiveFacets } from "@/app/video/ArchiveFacets";
import { ArchiveState, resolveSort } from "@/app/video/archiveSearchUrl";

/**
 * Ten or so today, but the endpoint paginates, so the whole list has to be
 * asked for rather than assumed to fit in one default page.
 */
const CATEGORY_LIMIT = 100;

const loadCategories = async (): Promise<ArchiveCategory[]> => {
  // A missing category list costs the reader one facet, not the page: the
  // search box and the other two facets still work, so the group simply isn't
  // drawn.
  const response = await ssrCategoriesList(
    { limit: CATEGORY_LIMIT },
    { next: { revalidate: 3600 } },
  ).catch((error: unknown) => {
    console.error("Archive categories could not be fetched:", error);
    return null;
  });

  if (response?.status !== 200) return [];

  // An empty category leads nowhere, so it isn't offered.
  return response.data.results.filter((category) => category.videocount > 0);
};

/**
 * The archive's filter rail: a column beside the results on a desktop, and a
 * disclosure above them on a phone.
 *
 * Beside rather than above, which is the change that matters. The chips this
 * replaces sat between the search box and the results and took six rows of a
 * phone screen, so every reader scrolled past every filter to reach the
 * results whether they wanted to filter or not. In a column the filters cost
 * no vertical space at all, and the first result is visible without scrolling.
 *
 * The page makes that column sticky, because the reason to look at the rail is
 * usually something further down the list: a fourth screen of results with the
 * filters scrolled off the top is a scroll back up to change anything.
 */
export const ArchiveFilters = async ({ state }: { state: ArchiveState }) => {
  const categories = await loadCategories();

  // Named on the phone's summary so a reader who has collapsed the disclosure
  // can still tell that something inside it is narrowing what they see.
  //
  // The sort counts only when it differs from what the page would have done
  // anyway: picking the order it was already in leaves `sort=nyest` in the URL,
  // and a badge over a collapsed panel that nothing inside it changed is a
  // false alarm.
  const hasQuery = Boolean(state.query);
  const isSorted = resolveSort(state.sort, hasQuery) !== resolveSort("", hasQuery);
  const activeCount = [state.category, state.length, isSorted].filter(Boolean).length;

  return (
    <>
      <aside aria-labelledby="archive-filters-heading" className="hidden lg:block">
        <h2 id="archive-filters-heading" className="sr-only">
          Filtrer og sorter
        </h2>
        <ArchiveFacets state={state} categories={categories} idPrefix="rail" />
      </aside>

      {/*
        `<details>` is the browser's own disclosure: it opens with no
        JavaScript, and it is announced as an expandable button without any
        aria of ours. The facets inside are a second copy of the rail's - see
        ArchiveFacets on why they aren't one copy moved around by CSS.
      */}
      <details className="group rounded-xl bg-background/80 shadow-sm ring-1 ring-default-200 lg:hidden">
        <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl px-3 py-2.5 text-small font-medium outline-hidden focus-visible:ring-2 focus-visible:ring-focus [&::-webkit-details-marker]:hidden">
          <GoFilter aria-hidden className="size-4 shrink-0" />
          Filtrer og sorter
          {activeCount > 0 && (
            <span className="rounded-full bg-primary px-1.5 text-tiny font-semibold text-primary-foreground">
              {activeCount}
            </span>
          )}
          <GoChevronDown
            aria-hidden
            className="ml-auto size-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
          />
        </summary>

        <div className="border-t border-default-200 p-3">
          <ArchiveFacets state={state} categories={categories} idPrefix="sheet" />
        </div>
      </details>
    </>
  );
};
