import type { Metadata } from "next";
import Link from "next/link";
import { loadSource } from "../loadSource";
import { SourceCheck } from "../SourceCheck";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sjekk signalet" };

export default async function Page({
  params,
}: {
  params: Promise<{ organizationId: string; sourceId: string }>;
}) {
  const { organizationId, source } = await loadSource(params);
  return (
    <section className="flex flex-col gap-5">
      <header>
        <Link
          className="text-sm font-semibold text-link hover:underline"
          href={`/organization/${organizationId}/live`}
        >
          ← Direktesending
        </Link>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
          Sjekk signalet: {source.name}
        </h1>
      </header>
      <SourceCheck organizationId={organizationId} source={source} />
    </section>
  );
}
