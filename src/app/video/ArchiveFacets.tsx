import Link from "next/link";
import { ReactNode } from "react";
import {
  ARCHIVE_LENGTHS,
  ARCHIVE_SORTS,
  ArchiveLength,
  ArchiveState,
  archiveUrlWith,
  resolveSort,
  sortsFor,
} from "@/app/video/archiveSearchUrl";

/** A category, reduced to what the rail draws. */
export type ArchiveCategory = { id: number; name: string; videocount: number };

const FacetGroup = ({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) => (
  <section aria-labelledby={id}>
    <h3
      id={id}
      className="px-2 pb-1 text-tiny font-bold uppercase tracking-wide text-foreground/60"
    >
      {title}
    </h3>
    <ul>{children}</ul>
  </section>
);

/**
 * One value a facet can take. A link rather than a control, so every state of
 * this page has a URL that can be shared, bookmarked and gone back to, and so
 * the whole rail works before - or without - the client bundle.
 */
const FacetOption = ({
  href,
  label,
  count,
  isActive,
}: {
  href: string;
  label: string;
  count?: number;
  isActive: boolean;
}) => (
  <li>
    <Link
      href={href}
      // aria-current marks the one that is on. It is the only cue a screen
      // reader gets - the filled background isn't one - and it is set on
      // exactly one option per group, so "current" means something.
      aria-current={isActive ? "true" : undefined}
      // The count is drawn as a bare number, which reads as a stray digit out
      // loud. Spelling it out keeps the visible name inside the accessible
      // one, as the two have to match.
      aria-label={count === undefined ? undefined : `${label}, ${count} videoer`}
      className={`flex items-baseline justify-between gap-2 rounded-lg px-2 py-1.5 text-small outline-hidden focus-visible:ring-2 focus-visible:ring-focus ${
        isActive
          ? "bg-content2 font-semibold text-content2-foreground"
          : "hover:bg-content1 hover:text-content1-foreground"
      }`}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span
          aria-hidden
          className={`shrink-0 text-tiny tabular-nums ${isActive ? "opacity-60" : "text-foreground/60"}`}
        >
          {count}
        </span>
      )}
    </Link>
  </li>
);

/**
 * The archive's facets: what it is about, how long it runs, and what order to
 * read it in.
 *
 * Rendered twice - once in the desktop rail, once inside the phone's
 * disclosure - so `idPrefix` keeps the two copies' heading ids apart. Two
 * copies rather than one moved about by CSS because `<details>` is the native
 * disclosure and its open state is a DOM property, not something a media
 * query can set: the alternative was a hand-built one that would need
 * JavaScript to open, and a filter nobody can reach without JavaScript is
 * worse than a kilobyte of markup nobody sees.
 *
 * A vertical list rather than the cloud of chips this replaced. The counts
 * here run from 10 to 1261, and chips of equal size drawn in the order the
 * API returns them present that as ten equivalent choices; a list gives each
 * one a line and puts the counts in a column that can actually be compared.
 */
export const ArchiveFacets = ({
  state,
  categories,
  idPrefix,
}: {
  state: ArchiveState;
  categories: ArchiveCategory[];
  idPrefix: string;
}) => {
  const activeSort = resolveSort(state.sort, Boolean(state.query));

  // `videocount` counts a category across the whole archive. That is the truth
  // while the archive is what is on screen, and a promise the filter can't
  // keep the moment anything else narrows it: beside "8 treff på «musikk»",
  // "Kultur 243" reads as 243 waiting behind the chip. Shown when it is
  // accurate, dropped when it isn't.
  const showCounts = !state.query && state.organization === undefined && !state.length;

  return (
    <div className="space-y-5">
      {!!categories.length && (
        <FacetGroup id={`${idPrefix}-category`} title="Kategori">
          <FacetOption
            href={archiveUrlWith(state, { category: "" })}
            label="Alle kategorier"
            isActive={!state.category}
          />
          {categories.map((category) => (
            <FacetOption
              key={category.id}
              href={archiveUrlWith(state, { category: category.name })}
              label={category.name}
              count={showCounts ? category.videocount : undefined}
              isActive={category.name === state.category}
            />
          ))}
        </FacetGroup>
      )}

      <FacetGroup id={`${idPrefix}-length`} title="Lengde">
        <FacetOption
          href={archiveUrlWith(state, { length: "" })}
          label="Alle lengder"
          isActive={!state.length}
        />
        {(Object.keys(ARCHIVE_LENGTHS) as ArchiveLength[]).map((length) => (
          <FacetOption
            key={length}
            href={archiveUrlWith(state, { length })}
            label={ARCHIVE_LENGTHS[length].label}
            isActive={length === state.length}
          />
        ))}
      </FacetGroup>

      <FacetGroup id={`${idPrefix}-sort`} title="Sortering">
        {sortsFor(Boolean(state.query)).map((sort) => (
          <FacetOption
            key={sort}
            href={archiveUrlWith(state, { sort })}
            label={ARCHIVE_SORTS[sort].label}
            isActive={sort === activeSort}
          />
        ))}
      </FacetGroup>
    </div>
  );
};
