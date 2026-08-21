import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense, cache } from "react";
import { ArchiveSearch } from "@/app/video/ArchiveSearch";
import { CategoryFilter } from "@/app/video/CategoryFilter";
import { LatestVideos } from "@/app/video/LatestVideos";
import { SearchResults } from "@/app/video/SearchResults";
import {
  ArchiveScope,
  archiveSearchUrl,
  firstValue,
  parseCategory,
  parseOrganization,
  parsePage,
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
  const { data, status } = await ssrOrganizationRetrieve(String(organization), {
    cache: "no-store",
  });

  return status === 200 ? { id: data.id, name: data.name } : null;
});

const scopeFrom = async (searchParams: Awaited<ArchivePageProps["searchParams"]>) => {
  const organization = parseOrganization(searchParams.organization);

  return organization === undefined ? null : loadScope(organization);
};

export async function generateMetadata({ searchParams }: ArchivePageProps): Promise<Metadata> {
  const params = await searchParams;
  const query = firstValue(params.q).trim();
  const category = parseCategory(params.category);
  const scope = await scopeFrom(params);

  return {
    title: [query && `«${query}»`, scope?.name, category, "Arkiv", "Frikanalen"]
      .filter(Boolean)
      .join(" - "),
    description: scope
      ? `Videoer fra ${scope.name} i Frikanalens arkiv.`
      : "Søk i Frikanalens arkiv over videoer fra norsk organisasjonsliv.",
  };
}

export default async function ArchivePage({ searchParams }: ArchivePageProps) {
  const params = await searchParams;
  const query = firstValue(params.q).trim();
  const category = parseCategory(params.category);
  const page = parsePage(params.page);
  const scope = await scopeFrom(params);

  // An id that names no organization is a 404 rather than a silently dropped
  // filter: a page headed "0 videoer" for an organization that was never
  // there reads as an empty archive rather than as a bad link.
  if (scope === null && parseOrganization(params.organization) !== undefined) return notFound();

  const isNarrowed = Boolean(query || category || scope);

  return (
    <main className="w-full max-w-5xl grow px-2">
      {/*
        A surface between the body's radial gradient and the text on top of it.
        The gradient is dimmer than it was, which fixed the contrast on its own,
        but a page whose text sits on a plain surface rather than straight on a
        glow is the easier one to read, and it keeps the archive legible if the
        gradient is ever brightened again.

        Half-opaque rather than more: the gradient behind it is already dim, and
        at /70 the panel swallowed it entirely and left the page flat. At /50
        the glow still reads through, and the worst text contrast stays well
        clear of the 4.5:1 that normal text needs.

        Darker than the controls it holds: the search field, chips and
        pagination links keep their opaque `bg-background`, so they sit as
        darker wells on this rather than dissolving into it.
      */}
      <div className="space-y-8 rounded-2xl bg-background/50 p-4 shadow-lg sm:p-6">
        <h1 className="text-4xl font-black">{scope ? scope.name : "Arkiv"}</h1>

        <ArchiveSearch initialQuery={query} scope={scope ?? undefined} />

        {!isNarrowed && (
          <p className="max-w-prose text-lg">
            Her ligger videoene som har vært sendt på Frikanalen. Søk etter tittel, tema eller
            organisasjonen som står bak - eller bla gjennom kategoriene under.
          </p>
        )}

        {/*
          Only off an organization's page: there the heading already names one
          narrowing, and a second row of them competing with it reads as two
          filters arguing rather than one page about one organization.

          Its own Suspense boundary, so a slow category list never holds up the
          results below it - and no fallback, because a row of chips appearing
          late is less distracting than a placeholder for one.
        */}
        {!scope && (
          <Suspense fallback={null}>
            <CategoryFilter query={query} activeCategory={category} />
          </Suspense>
        )}

        {isNarrowed ? (
          // Keyed on the narrowings so a new search swaps in its own fallback
          // rather than leaving the previous page's results up while it loads.
          <Suspense
            key={`${scope?.id ?? ""}:${query}:${category}:${page}`}
            fallback={<p className="text-foreground/75">Søker …</p>}
          >
            <SearchResults
              query={query}
              page={page}
              scope={scope ?? undefined}
              category={category}
            />
          </Suspense>
        ) : (
          <Suspense fallback={<p className="text-foreground/75">Henter de nyeste videoene …</p>}>
            <LatestVideos />
          </Suspense>
        )}

        {scope && (
          <p>
            <Link className="underline" href={archiveSearchUrl({ query })}>
              {query ? `Søk etter «${query}» i hele arkivet` : "Se hele arkivet"}
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
