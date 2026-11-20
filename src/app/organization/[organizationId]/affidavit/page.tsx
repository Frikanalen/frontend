import { affidavitHref } from "@/app/organization/[organizationId]/affidavit/affidavitHref";
import { OrganizationParams, parseParamsOr404 } from "@/lib/routeParams";
import { redirect } from "next/navigation";

// Per-visitor: rendered on request, without a static shell of its own.
export const instant = false;

/** The declaration lives in a dialog on Kom i gang; old links land there. */
export default async function Page({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await parseParamsOr404(OrganizationParams, params);
  redirect(affidavitHref(organizationId));
}
