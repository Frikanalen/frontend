import { getUserOrNull } from "@/app/getUserOrNull";
import { profileIsAdminOrMember } from "@/app/organization/[organizationId]/admin/profileIsAdminOrMember";
import { AffidavitUpload } from "@/app/organization/[organizationId]/affidavit/AffidavitUpload";
import RedaktorAnsvarFrikanalen from "@/app/organization/[organizationId]/RedaktorAnsvarFrikanalen";
import {
  ssrOrganizationAffidavitList,
  ssrOrganizationRetrieve,
} from "@/generated/ssr/organization/organization";
import { getCookiesFromRequest } from "@/lib/getCookiesFromRequest";
import { OrganizationParams, parseParamsOr404 } from "@/lib/routeParams";
import type { Metadata } from "next";
import Link from "next/link";
import { forbidden, notFound, redirect } from "next/navigation";

// Per-visitor: rendered on request, without a static shell of its own.
export const instant = false;

export const metadata: Metadata = { title: "Redaktørerklæring - Frikanalen" };

/** A blank to fill in by hand where the organization has given nothing. */
const orBlank = (value: string | null | undefined) =>
  value?.trim() || <span aria-label="fylles inn for hånd">____________________</span>;

const Step = ({ n, title, children }: { n: number; title: string; children: React.ReactNode }) => (
  <li className="flex gap-4 border-b border-default-200 py-5">
    <span
      aria-hidden
      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-stage text-sm font-bold text-stage-foreground"
    >
      {n}
    </span>
    <div className="min-w-0 flex-1">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-2">{children}</div>
    </div>
  </li>
);

export default async function Page({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await parseParamsOr404(OrganizationParams, params);
  const headers = await getCookiesFromRequest();
  const user = await getUserOrNull(headers);
  if (!user) redirect("/login");
  if (!user.isStaff && !profileIsAdminOrMember(organizationId, user)) forbidden();

  const response = await ssrOrganizationRetrieve(organizationId, { headers, cache: "no-store" });
  if (response.status !== 200) notFound();
  const organization = response.data;
  const submissions = await ssrOrganizationAffidavitList(organizationId, {
    headers,
    cache: "no-store",
  });
  const latest = submissions.status === 200 ? submissions.data[0] : undefined;
  const pdf = `/organization/${organizationId}/affidavit/pdf`;

  return (
    <div className="w-full max-w-4xl px-4 pt-8 sm:px-6">
      <div className="bg-background p-6 text-foreground sm:p-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Redaktørerklæringen</h1>
          <p className="mt-3 max-w-2xl text-lg text-default-700">
            {organization.fkmember
              ? "Frikanalen har godkjent erklæringen. Organisasjonen er medlem, og redaktørens identitet er bekreftet."
              : "Redaktøren signerer erklæringen og laster opp en skannet kopi. Når Frikanalen har sjekket den, blir organisasjonen medlem og redaktørens identitet bekreftet."}
          </p>
        </header>
        {!organization.fkmember && (
          <ol className="mt-6 border-t border-foreground">
            <Step n={1} title="Last ned og skriv ut">
              <p className="text-default-700">
                Erklæringen er fylt ut med opplysningene om organisasjonen. Stemmer noe ikke, kan du
                rette det for hånd før du signerer.
              </p>
              <a
                className="mt-3 inline-flex h-11 items-center rounded-md bg-accent px-5 font-semibold text-accent-foreground hover:opacity-90"
                href={pdf}
                download
              >
                Last ned erklæringen (PDF)
              </a>
            </Step>
            <Step n={2} title="Signer">
              <p className="text-default-700">
                Skriv sted, dato og signaturen din nederst på siden.
              </p>
            </Step>
            <Step n={3} title="Last opp en skannet kopi">
              <AffidavitUpload
                organizationId={organizationId}
                latest={latest}
                isEditor={organization.editorId === user.id || user.isStaff}
              />
            </Step>
          </ol>
        )}
        <details className="mt-8">
          <summary className="cursor-pointer font-semibold">Se erklæringen</summary>
          <div className="mt-4">
            <RedaktorAnsvarFrikanalen
              organization={organization.name}
              orgNumber={orBlank(organization.orgnr)}
              address={orBlank(organization.postalAddress)}
              email={orBlank(organization.editorEmail)}
              editorName={orBlank(organization.editorName?.toUpperCase())}
            />
          </div>
        </details>
        <p className="mt-8">
          <Link
            className="font-semibold text-link hover:underline"
            href={`/organization/${organizationId}/start`}
          >
            Tilbake til Kom i gang
          </Link>
        </p>
      </div>
    </div>
  );
}
