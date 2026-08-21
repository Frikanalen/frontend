import Link from "next/link";
import { GoChevronLeft, GoChevronRight } from "react-icons/go";
import { ArchiveState, archiveSearchUrl } from "@/app/video/archiveSearchUrl";

/** How many pages either side of the current one are always spelled out. */
const WINDOW = 2;

/**
 * The page numbers worth drawing: the first, the last, a window around where
 * the reader is, and a gap marker wherever a run was left out.
 *
 * The whole archive is over a hundred pages, so every page number is not an
 * option - but neither is the bare Forrige/Neste pair this replaces, which
 * told a reader neither where they were nor how much was left, and made page
 * ninety a hundred clicks away from page one.
 */
export const pageWindow = (page: number, lastPage: number) => {
  const pages: (number | "gap")[] = [];
  let previous = 0;

  for (let n = 1; n <= lastPage; n++) {
    if (n !== 1 && n !== lastPage && Math.abs(n - page) > WINDOW) continue;
    if (previous && n - previous > 1) pages.push("gap");

    pages.push(n);
    previous = n;
  }

  return pages;
};

const stepClassName =
  "flex items-center gap-1 rounded-lg px-2.5 py-2 text-small outline-hidden hover:bg-content1 focus-visible:ring-2 focus-visible:ring-focus";

export const ArchivePagination = ({
  state,
  lastPage,
}: {
  state: ArchiveState;
  lastPage: number;
}) => {
  if (lastPage < 2) return null;

  const { page } = state;
  const pageUrl = (target: number) => archiveSearchUrl({ ...state, page: target });

  return (
    <nav aria-label="Sider med treff" className="flex items-center justify-center gap-1 pt-2">
      {page > 1 && (
        <Link href={pageUrl(page - 1)} rel="prev" className={stepClassName}>
          <GoChevronLeft aria-hidden className="size-4" />
          Forrige
        </Link>
      )}

      <ul className="flex items-center gap-1">
        {pageWindow(page, lastPage).map((entry, index) =>
          entry === "gap" ? (
            // Announced as nothing: the numbers either side of it already say
            // that a run was skipped, and "horizontal ellipsis" said twice in
            // a row of page numbers is noise.
            <li key={`gap-${index}`} aria-hidden className="px-1 text-foreground/50">
              …
            </li>
          ) : (
            <li key={entry}>
              {entry === page ? (
                <span
                  aria-current="page"
                  className="flex min-w-9 justify-center rounded-lg bg-primary px-2.5 py-2 text-small font-semibold text-primary-foreground tabular-nums"
                >
                  {entry}
                </span>
              ) : (
                <Link
                  href={pageUrl(entry)}
                  aria-label={`Side ${entry}`}
                  className="flex min-w-9 justify-center rounded-lg px-2.5 py-2 text-small tabular-nums outline-hidden hover:bg-content1 focus-visible:ring-2 focus-visible:ring-focus"
                >
                  {entry}
                </Link>
              )}
            </li>
          ),
        )}
      </ul>

      {page < lastPage && (
        <Link href={pageUrl(page + 1)} rel="next" className={stepClassName}>
          Neste
          <GoChevronRight aria-hidden className="size-4" />
        </Link>
      )}
    </nav>
  );
};
