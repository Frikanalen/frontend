import { Metadata } from "next";
import { Suspense } from "react";
import { ArchiveSearch } from "@/app/video/ArchiveSearch";
import { SearchResults } from "@/app/video/SearchResults";
import { firstValue, parsePage } from "@/app/video/archiveSearchUrl";

type ArchivePageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const queryFrom = async (searchParams: ArchivePageProps["searchParams"]) =>
  firstValue((await searchParams).q).trim();

export async function generateMetadata({ searchParams }: ArchivePageProps): Promise<Metadata> {
  const query = await queryFrom(searchParams);

  return {
    title: query ? `«${query}» - Arkiv - Frikanalen` : "Arkiv - Frikanalen",
    description: "Søk i Frikanalens arkiv over videoer fra norsk organisasjonsliv.",
  };
}

export default async function ArchivePage({ searchParams }: ArchivePageProps) {
  const params = await searchParams;
  const query = firstValue(params.q).trim();
  const page = parsePage(params.page);

  return (
    <main className="w-full max-w-5xl grow space-y-8 px-2">
      <h1 className="text-4xl font-black">Arkiv</h1>

      <ArchiveSearch initialQuery={query} />

      {query ? (
        // Keyed on the search so a new query swaps in its own fallback rather
        // than leaving the previous page's results up while it loads.
        <Suspense key={`${query}:${page}`} fallback={<p className="text-foreground/75">Søker …</p>}>
          <SearchResults query={query} page={page} />
        </Suspense>
      ) : (
        <p className="max-w-prose text-lg">
          Her ligger videoene som har vært sendt på Frikanalen. Søk etter tittel, tema eller
          organisasjonen som står bak.
        </p>
      )}
    </main>
  );
}
