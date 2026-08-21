/** How many results one page of the archive shows. */
export const ARCHIVE_PAGE_SIZE = 24;

/**
 * The organization an archive view is narrowed to. Carried as a pair rather
 * than as a bare id because every consumer that filters by the id also needs
 * to name the organization on screen, and two separate props drift apart.
 */
export type ArchiveScope = { id: number; name: string };

/**
 * The archive's own URL shape, shared by the search box, the category chips,
 * the pagination links and the organization pages so they can't drift apart.
 *
 * Every narrowing is optional and independent: a query alone searches
 * everything, an organization alone lists that organization's videos, a
 * category alone lists that category, and any combination narrows further.
 * Page 1 is left implicit to keep the URL a user is most likely to share or
 * bookmark free of noise.
 *
 * Callers pass only what they mean to keep, which is how the search box drops
 * the active category: its suggestions are drawn from the whole archive, so
 * the search it runs has to span the whole archive too, or a suggestion could
 * be visibly offered and then filtered out of its own results. Narrowing is
 * the chips' job, and they preserve the query.
 */
export const archiveSearchUrl = ({
  query = "",
  organization,
  category = "",
  page = 1,
}: {
  query?: string;
  organization?: number;
  category?: string;
  page?: number;
}) => {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (organization !== undefined) params.set("organization", String(organization));
  if (category) params.set("category", category);
  if (page > 1) params.set("page", String(page));

  const search = params.toString();

  return search ? `/video?${search}` : "/video";
};

/**
 * searchParams hands back a string, an array of them (`?q=a&q=b`), or
 * nothing at all. Only the first value of a repeated parameter is meaningful
 * here.
 */
export const firstValue = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value) ?? "";

/** Page numbers arrive as untrusted text; anything unusable is page 1. */
export const parsePage = (value: string | string[] | undefined) => {
  const page = Number.parseInt(firstValue(value), 10);

  return Number.isFinite(page) && page > 0 ? page : 1;
};

/**
 * Organization ids arrive as untrusted text too. Anything unusable drops the
 * narrowing entirely rather than standing in for an organization: a scope the
 * visitor didn't ask for is worse than none.
 *
 * Matched whole rather than parsed leniently, because parseInt takes any
 * valid prefix - "1.5e3" and "82abc" would otherwise narrow to organizations
 * 1 and 82, neither of which the visitor asked for.
 */
export const parseOrganization = (value: string | string[] | undefined) => {
  const raw = firstValue(value);
  if (!/^\d+$/.test(raw)) return undefined;

  const organization = Number.parseInt(raw, 10);

  return organization > 0 ? organization : undefined;
};

/**
 * Category names arrive as untrusted text, and are passed to the API as they
 * came: the filter validates each name against the real categories and
 * rejects one it doesn't have, so an invented name is a 400 that
 * SearchResults reports rather than a silently empty archive.
 */
export const parseCategory = (value: string | string[] | undefined) => firstValue(value).trim();
