import Link from "next/link";
import { GoX } from "react-icons/go";
import {
  ARCHIVE_LENGTHS,
  ArchiveScope,
  ArchiveState,
  archiveSearchUrl,
  archiveUrlWith,
} from "@/app/video/archiveSearchUrl";

/**
 * What is currently being left out, and one click each to stop leaving it out.
 *
 * The archive can be narrowed four ways at once, and before this there was
 * nowhere on the page that said so: the query lived in the search field, the
 * organization in the heading, the category in whichever chip happened to be
 * filled in, and the only way to widen a search back out was to work out
 * which control had done the narrowing. Gathering them here makes the state
 * of the page readable in one line and reversible one piece at a time.
 *
 * The sort is deliberately not among them. It changes the order of the
 * results, not which results there are, so a chip offering to remove it would
 * be answering a question nobody asked.
 */
export const ActiveFilters = ({ state, scope }: { state: ArchiveState; scope?: ArchiveScope }) => {
  const filters = [
    state.query && {
      key: "q",
      label: `«${state.query}»`,
      href: archiveUrlWith(state, { query: "" }),
    },
    scope && {
      key: "org",
      label: scope.name,
      href: archiveUrlWith(state, { organization: undefined }),
    },
    state.category && {
      key: "category",
      label: state.category,
      href: archiveUrlWith(state, { category: "" }),
    },
    state.length && {
      key: "length",
      label: ARCHIVE_LENGTHS[state.length].label,
      href: archiveUrlWith(state, { length: "" }),
    },
  ].filter((filter) => !!filter);

  if (!filters.length) return null;

  return (
    // A list, so a screen reader says how many narrowings are in force before
    // reading them out - which is the fact that matters when a search comes
    // back with nothing.
    <ul aria-label="Aktive filtre" className="flex flex-wrap items-center gap-2">
      {filters.map(({ key, label, href }) => (
        <li key={key}>
          <Link
            href={href}
            aria-label={`Fjern filteret ${label}`}
            className="flex items-center gap-1.5 rounded-full bg-content2 py-1 pl-3 pr-2 text-small text-content2-foreground outline-hidden hover:bg-content3 focus-visible:ring-2 focus-visible:ring-focus"
          >
            {label}
            <GoX aria-hidden className="size-3.5 opacity-70" />
          </Link>
        </li>
      ))}

      {filters.length > 1 && (
        <li>
          <Link
            href={archiveSearchUrl({ sort: state.sort })}
            className="rounded-full px-2 py-1 text-small underline underline-offset-2 outline-hidden hover:text-foreground focus-visible:ring-2 focus-visible:ring-focus"
          >
            Nullstill alle
          </Link>
        </li>
      )}
    </ul>
  );
};
