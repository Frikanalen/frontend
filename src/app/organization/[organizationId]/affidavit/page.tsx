import { getUserOrNull } from "@/app/getUserOrNull";
import { profileIsAdminOrMember } from "@/app/organization/[organizationId]/admin/profileIsAdminOrMember";
import { PrintButton } from "@/app/organization/[organizationId]/affidavit/PrintButton";
import RedaktorAnsvarFrikanalen from "@/app/organization/[organizationId]/RedaktorAnsvarFrikanalen";
import { ssrOrganizationRetrieve } from "@/generated/ssr/organization/organization";
import { getCookiesFromRequest } from "@/lib/getCookiesFromRequest";
import { OrganizationParams, parseParamsOr404 } from "@/lib/routeParams";
import type { Metadata } from "next";
import Link from "next/link";
import { forbidden, notFound, redirect } from "next/navigation";

// Per-visitor: rendered on request, without a static shell of its own.
export const instant = false;

export const metadata: Metadata = { title: "Redaktørerklæring - Frikanalen" };

// On paper, only the declaration: no site header, studio bar or footer, and
// black on white whatever the screen theme is.
const PRINT_CSS = `
@media print {
  body * { visibility: hidden; }
  #affidavit, #affidavit * { visibility: visible; color: #000 !important; }
  #affidavit { position: absolute; inset: 0 auto auto 0; width: 100%; padding: 0 0 0 1.5rem; background: #fff; }
}`;

/** A blank to fill in by hand where the organization has given nothing. */
const orBlank = (value: string | null | undefined) =>
  value?.trim() || <span aria-label="fylles inn for hånd">____________________</span>;

export default async function Page({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await parseParamsOr404(OrganizationParams, params);
  const headers = await getCookiesFromRequest();
  const user = await getUserOrNull(headers);
  if (!user) redirect("/login");
  if (!user.isStaff && !profileIsAdminOrMember(organizationId, user)) forbidden();

  const response = await ssrOrganizationRetrieve(organizationId, { headers, cache: "no-store" });
  if (response.status !== 200) notFound();
  const organization = response.data;

  return (
    <div className="w-full max-w-4xl px-4 pt-8 sm:px-6">
      <style>{PRINT_CSS}</style>
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Redaktørerklæringen</h1>
        <p className="mt-3 max-w-2xl text-lg text-default-700">
          Skriv ut erklæringen, signer den og send den til Foreningen Frikanalen per post. Når
          brevet er mottatt, godkjenner Frikanalen medlemskapet og bekrefter samtidig redaktørens
          identitet.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
          <PrintButton />
          <Link
            className="font-semibold text-link hover:underline"
            href={`/organization/${organizationId}/start`}
          >
            Tilbake til Kom i gang
          </Link>
        </div>
      </header>
      <div id="affidavit" className="bg-background p-6 text-foreground sm:p-10">
        <RedaktorAnsvarFrikanalen
          organization={organization.name}
          orgNumber={orBlank(organization.orgnr)}
          address={orBlank(organization.postalAddress)}
          email={orBlank(organization.editorEmail)}
          editorName={orBlank(organization.editorName?.toUpperCase())}
          editorPhone={orBlank(organization.editorMsisdn)}
        />
      </div>
    </div>
  );
}
