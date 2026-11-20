import { AffidavitUpload } from "@/app/organization/[organizationId]/affidavit/AffidavitUpload";
import RedaktorAnsvarFrikanalen from "@/app/organization/[organizationId]/RedaktorAnsvarFrikanalen";
import type { AffidavitSubmission, Organization } from "@/generated/frikanalenDjangoAPI.schemas";
import type { ReactNode } from "react";

/** A blank to fill in by hand where the organization has given nothing. */
const orBlank = (value: string | null | undefined) =>
  value?.trim() || <span aria-label="fylles inn for hånd">____________________</span>;

const Step = ({ n, title, children }: { n: number; title: string; children: ReactNode }) => (
  <li className="flex gap-4 border-b border-default-200 py-5">
    <span
      aria-hidden
      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-stage text-sm font-bold text-stage-foreground"
    >
      {n}
    </span>
    <div className="min-w-0 flex-1">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="mt-2">{children}</div>
    </div>
  </li>
);

/**
 * The editor's declaration, from download to upload: what goes in the dialog
 * on Kom i gang.
 */
export const AffidavitSteps = ({
  organization,
  latest,
  isEditor,
}: {
  organization: Organization;
  latest: AffidavitSubmission | undefined;
  isEditor: boolean;
}) => (
  <div>
    <p className="max-w-2xl text-default-700">
      {organization.fkmember
        ? "Frikanalen har godkjent erklæringen. Organisasjonen er medlem, og redaktørens identitet er bekreftet."
        : "Redaktøren signerer erklæringen og laster opp en skannet kopi. Når Frikanalen har sjekket den, blir organisasjonen medlem og redaktørens identitet bekreftet."}
    </p>
    {!organization.fkmember && (
      <ol className="mt-4 border-t border-foreground">
        <Step n={1} title="Last ned og skriv ut">
          <p className="text-default-700">
            Erklæringen er fylt ut med opplysningene om organisasjonen. Stemmer noe ikke, kan du
            rette det for hånd før du signerer.
          </p>
          <a
            className="mt-3 inline-flex h-11 items-center rounded-md bg-accent px-5 font-semibold text-accent-foreground hover:opacity-90"
            href={`/organization/${organization.id}/affidavit/pdf`}
            download
          >
            Last ned erklæringen (PDF)
          </a>
        </Step>
        <Step n={2} title="Signer">
          <p className="text-default-700">Skriv sted, dato og signaturen din nederst på siden.</p>
        </Step>
        <Step n={3} title="Last opp en skannet kopi">
          <AffidavitUpload organizationId={organization.id} latest={latest} isEditor={isEditor} />
        </Step>
      </ol>
    )}
    <details className="mt-6">
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
  </div>
);
