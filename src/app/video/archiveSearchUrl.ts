import z from "zod";

/** How many results one page of the archive shows. */
export const ARCHIVE_PAGE_SIZE = 24;

/**
 * The organization an archive view is narrowed to. Carried as a pair rather
 * than as a bare id because every consumer that filters by the id also needs
 * to name the organization on screen, and two separate props drift apart.
 */
export type ArchiveScope = { id: number; name: string };

/**
 * The orders the archive can be read in, keyed by the value that appears in
 * the URL and carrying both the label shown on screen and the API's own
 * `ordering` field, so the two can't be wired up differently in two places.
 *
 * `relevans` has no ordering of its own: the API ranks a free-text search by
 * relevance when nothing overrides it, and that ranking is the whole point of
 * having searched. It is therefore only offered alongside a query - see
 * `resolveSort`.
 *
 * `-created_time` rather than the `-uploaded_time` that looks more honest:
 * uploaded_time is nullable, Postgres sorts nulls first descending, and the
 * legacy rows that never got one would take the whole first page.
 */
export const ARCHIVE_SORTS = {
  relevans: { label: "Mest relevant", ordering: undefined },
  nyest: { label: "Nyeste først", ordering: "-created_time" },
  eldst: { label: "Eldste først", ordering: "created_time" },
  lengst: { label: "Lengst først", ordering: "-duration" },
  kortest: { label: "Kortest først", ordering: "duration" },
  tittel: { label: "Tittel A–Å", ordering: "name" },
} as const;

export type ArchiveSort = keyof typeof ARCHIVE_SORTS;

/**
 * Length bands, as ranges over the API's `duration` filter.
 *
 * Half-open on purpose - `gte` the lower bound, `lt` the upper - so a video of
 * exactly ten minutes lands in one band rather than in two, and the four
 * counts add up to the archive.
 *
 * The boundaries follow what the archive actually holds: roughly 290 videos
 * under ten minutes, 1700 between ten and thirty, 480 up to the hour and 110
 * beyond it. Bands that each return something are worth offering; a band that
 * is always empty is a dead end with a number next to it.
 */
export const ARCHIVE_LENGTHS = {
  "under-10": { label: "Under 10 min", params: { duration__lt: "00:10:00" } },
  "10-30": {
    label: "10–30 min",
    params: { duration__gte: "00:10:00", duration__lt: "00:30:00" },
  },
  "30-60": {
    label: "30–60 min",
    params: { duration__gte: "00:30:00", duration__lt: "01:00:00" },
  },
  "over-60": { label: "Over 1 time", params: { duration__gte: "01:00:00" } },
} as const;

export type ArchiveLength = keyof typeof ARCHIVE_LENGTHS;

/**
 * Every way the archive can currently be narrowed or ordered, in one value.
 *
 * Passed around whole rather than as six loose arguments: the filter links,
 * the active-filter chips and the pagination all build URLs that differ from
 * the current one in exactly one field, and `{ ...state, category: "" }` says
 * that in a way six positional arguments can't.
 */
export type ArchiveState = {
  query: string;
  organization?: number;
  category: string;
  length: ArchiveLength | "";
  sort: ArchiveSort | "";
  page: number;
};

/**
 * The archive's own URL shape, shared by the search box, the filter rail, the
 * pagination links and the organization pages so they can't drift apart.
 *
 * Every narrowing is optional and independent: a query alone searches
 * everything, an organization alone lists that organization's videos, a
 * category or a length band alone lists that slice, and any combination
 * narrows further. Page 1 and the default sort are left implicit to keep the
 * URL a user is most likely to share or bookmark free of noise.
 *
 * Callers pass only what they mean to keep, which is how the search box drops
 * the active category: its suggestions are drawn from the whole archive, so
 * the search it runs has to span the whole archive too, or a suggestion could
 * be visibly offered and then filtered out of its own results. Narrowing is
 * the rail's job, and it preserves the query.
 */
export const archiveSearchUrl = ({
  query = "",
  organization,
  category = "",
  length = "",
  sort = "",
  page = 1,
}: Partial<ArchiveState>) => {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (organization !== undefined) params.set("organization", String(organization));
  if (category) params.set("category", category);
  if (length) params.set("length", length);
  if (sort) params.set("sort", sort);
  if (page > 1) params.set("page", String(page));

  const search = params.toString();

  return search ? `/video?${search}` : "/video";
};

/**
 * The same URL with one narrowing changed, and always back on page one.
 *
 * Every control that changes what is being looked for goes through here, so
 * none of them can leave the reader stranded on page 7 of a result set that
 * now has two pages.
 */
export const archiveUrlWith = (state: ArchiveState, change: Partial<ArchiveState>) =>
  archiveSearchUrl({ ...state, ...change, page: 1 });

/**
 * searchParams hands back a string, an array of them (`?q=a&q=b`), or nothing
 * at all. Only the first value of a repeated parameter is meaningful here.
 */
const first = z.preprocess((value) => (Array.isArray(value) ? value[0] : value) ?? "", z.string());

/**
 * A positive integer as it appears in a URL.
 *
 * Matched whole rather than parsed leniently, because parseInt takes any valid
 * prefix - "1.5e3" and "82abc" would otherwise read as 1 and 82, neither of
 * which the visitor asked for. Anything else is NaN, for the field to fall
 * back from.
 */
const wholeNumber = first
  .transform((raw) => (/^\d+$/.test(raw) ? Number(raw) : Number.NaN))
  .pipe(z.number().int().positive());

/**
 * The same, but absent rather than rejected when it can't be read.
 *
 * Spelled as a transform rather than `.optional().catch(undefined)` because an
 * explicit `{ organization: undefined }` slips past ZodOptional and lands on
 * the number check; this form is total by construction.
 */
const optionalWholeNumber = first.transform((raw) =>
  /^\d+$/.test(raw) && Number(raw) > 0 ? Number(raw) : undefined,
);

/**
 * One of a closed set the archive offers, or nothing.
 *
 * A length band or a sort the archive doesn't have is dropped rather than
 * reported, unlike a bad category. The difference is who wrote it: a category
 * comes from a link that may simply have gone stale, and is worth explaining,
 * while these two are closed sets that only this page's own controls produce -
 * anything else is a hand-edited URL, and the sensible reading of one is the
 * unfiltered archive in its default order.
 */
const oneOf = <T extends string>(values: readonly [T, ...T[]]) =>
  first.pipe(z.enum(values).or(z.literal(""))).catch("");

/**
 * The whole URL read at once, with every field total: a narrowing that cannot
 * be read falls back rather than failing, because the archive with a filter
 * dropped is always a better answer than an error page.
 *
 * An unusable organization drops the narrowing entirely instead of standing in
 * for an organization: a scope the visitor didn't ask for is worse than none.
 * Category names are passed to the API as they came, because only the API
 * knows the real names - it rejects one it doesn't have, so an invented name
 * is a 400 that SearchResults reports rather than a silently empty archive.
 */
export const ArchiveParams = z
  .object({
    q: first.transform((value) => value.trim()).catch(""),
    organization: optionalWholeNumber,
    category: first.transform((value) => value.trim()).catch(""),
    length: oneOf(Object.keys(ARCHIVE_LENGTHS) as [ArchiveLength, ...ArchiveLength[]]),
    sort: oneOf(Object.keys(ARCHIVE_SORTS) as [ArchiveSort, ...ArchiveSort[]]),
    page: wholeNumber.catch(1),
  })
  .transform(({ q, ...rest }): ArchiveState => ({ query: q, ...rest }));

/** Everything the URL says about what to show, in the shape the page passes around. */
export const archiveStateFrom = (searchParams: unknown): ArchiveState =>
  ArchiveParams.parse(searchParams);

/**
 * Which order a view is actually in, given what it was asked for.
 *
 * Two defaults rather than one, because "no sort chosen" means different
 * things either side of a search: a query wants the API's relevance ranking,
 * and a bare listing wants the newest videos first. Relevance asked for
 * without a query has nothing to rank, so it falls back to the same default a
 * bare listing gets - which is what happens when a search is cleared while
 * `sort=relevans` is still in the URL.
 */
export const resolveSort = (sort: ArchiveSort | "", hasQuery: boolean): ArchiveSort => {
  if (!sort) return hasQuery ? "relevans" : "nyest";

  return sort === "relevans" && !hasQuery ? "nyest" : sort;
};

/** The sorts worth offering: relevance only ranks something that was searched for. */
export const sortsFor = (hasQuery: boolean) =>
  (Object.keys(ARCHIVE_SORTS) as ArchiveSort[]).filter((sort) => hasQuery || sort !== "relevans");
