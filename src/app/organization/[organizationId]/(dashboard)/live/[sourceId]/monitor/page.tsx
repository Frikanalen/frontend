import type { Metadata } from "next";
import { loadSource } from "../../loadSource";
import { SourceMonitor } from "../../SourceMonitor";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sendeskjerm" };

export default async function Page({
  params,
}: {
  params: Promise<{ organizationId: string; sourceId: string }>;
}) {
  const { organizationId, source } = await loadSource(params);
  return <SourceMonitor organizationId={organizationId} source={source} />;
}
