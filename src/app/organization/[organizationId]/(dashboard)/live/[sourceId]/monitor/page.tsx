import type { Metadata } from "next";
import { loadSource } from "../../loadSource";
import { SourceMonitor } from "../../SourceMonitor";

// Per-visitor: rendered on request, without a static shell of its own.
export const instant = false;

export const metadata: Metadata = { title: "Sendeskjerm" };

export default async function Page({
  params,
}: {
  params: Promise<{ organizationId: string; sourceId: string }>;
}) {
  const { organizationId, source } = await loadSource(params);
  return <SourceMonitor organizationId={organizationId} source={source} />;
}
