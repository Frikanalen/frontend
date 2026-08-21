import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense, cache } from "react";
import { ArchiveSearch } from "@/app/video/ArchiveSearch";
import { SearchResults } from "@/app/video/SearchResults";
import {
  ArchiveScope,
  archiveSearchUrl,
  firstValue,
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
  const scope = await scopeFrom(params);

  return {
    title: [query && `«${query}»`, scope?.name, "Arkiv", "Frikanalen"].filter(Boolean).join(" - "),
    description: scope
      ? `Videoer fra ${scope.name} i Frikanalens arkiv.`
      : "Søk i Frikanalens arkiv over videoer fra norsk organisasjonsliv.",
  };
}

export default async function ArchivePage({ searchParams }: ArchivePageProps) {
  const params = await searchParams;
  const query = firstValue(params.q).trim();
  const page = parsePage(params.page);
  const scope = await scopeFrom(params);

  // An id that names no organization is a 404 rather than a silently dropped
  // filter: a page headed "0 videoer" for an organization that was never
  // there reads as an empty archive rather than as a bad link.
  if (scope === null && parseOrganization(params.organization) !== undefined) return notFound();

  return (
    <main className="w-full max-w-5xl grow space-y-8 px-2">
      <h1 className="text-4xl font-black">{scope ? scope.name : "Arkiv"}</h1>

      <ArchiveSearch initialQuery={query} scope={scope ?? undefined} />

      {query || scope ? (
        // Keyed on the search so a new query swaps in its own fallback rather
        // than leaving the previous page's results up while it loads.
        <Suspense
          key={`${scope?.id ?? ""}:${query}:${page}`}
          fallback={<p className="text-foreground/75">Søker …</p>}
        >
          <SearchResults query={query} page={page} scope={scope ?? undefined} />
        </Suspense>
      ) : (
        <p className="max-w-prose text-lg">
          Her ligger videoene som har vært sendt på Frikanalen. Søk etter tittel, tema eller
          organisasjonen som står bak.
        </p>
      )}

      {scope && (
        <p>
          <Link className="underline" href={archiveSearchUrl({ query })}>
            {query ? `Søk etter «${query}» i hele arkivet` : "Se hele arkivet"}
          </Link>
        </p>
      )}
    </main>
  );
}
