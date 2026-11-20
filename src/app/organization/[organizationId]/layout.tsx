import { ReactNode } from "react";
import { StudioBar } from "@/app/organization/[organizationId]/StudioBar";

// Per-visitor: rendered on request, without a static shell of its own.
export const instant = false;

/**
 * Everything under an organisation. Its members get the studio bar above the
 * page: one fixed place for the tools, so that Sendetid, Direktesending and
 * the rest are a menu rather than a row of buttons on one of the pages.
 * Visitors to the public profile see no bar at all.
 */
export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ organizationId: string }>;
}) {
  const organizationId = Number((await params).organizationId);

  return (
    <>
      <StudioBar organizationId={organizationId} />
      {children}
    </>
  );
}
