/** How many results one page of the archive shows. */
export const ARCHIVE_PAGE_SIZE = 24;

/**
 * The archive's own URL shape, shared by the search box and the pagination
 * links so the two can't drift apart. Page 1 is left implicit to keep the
 * URL a user is most likely to share or bookmark free of noise.
 */
export const archiveSearchUrl = (query: string, page: number = 1) => {
  const params = new URLSearchParams({ q: query });
  if (page > 1) params.set("page", String(page));

  return `/video?${params}`;
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
