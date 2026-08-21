/** How many results one page of the archive shows. */
export const ARCHIVE_PAGE_SIZE = 24;

/**
 * The organization an archive view is narrowed to. Carried as a pair rather
 * than as a bare id because every consumer that filters by the id also needs
 * to name the organization on screen, and two separate props drift apart.
 */
export type ArchiveScope = { id: number; name: string };

/**
 * The archive's own URL shape, shared by the search box, the pagination links
 * and the organization pages so they can't drift apart.
 *
 * Both narrowings are optional and independent: a query alone searches
 * everything, an organization alone lists that organization's videos, and
 * together they search within it. Page 1 is left implicit to keep the URL a
 * user is most likely to share or bookmark free of noise.
 */
export const archiveSearchUrl = ({
  query = "",
  organization,
  page = 1,
}: {
  query?: string;
  organization?: number;
  page?: number;
}) => {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (organization !== undefined) params.set("organization", String(organization));
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
