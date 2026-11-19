import { AffidavitClauses } from "@/app/about/join/affidavit/AffidavitClauses";
import type { ReactNode } from "react";

export default function RedaktorAnsvarFrikanalen({
  organization,
  orgNumber,
  address,
  email,
  editorName,
  editorPhone,
}: {
  organization: ReactNode;
  orgNumber: ReactNode;
  address: ReactNode;
  email: ReactNode;
  editorName: ReactNode;
  editorPhone: ReactNode;
}) {
  return (
    <article lang="no" aria-labelledby="tittel" className="prose dark:prose-invert max-w-none">
      <header className="not-prose mb-4">
        <h1 id="tittel" className="text-2xl font-semibold">
          Redaktøransvar – Frikanalen
        </h1>
      </header>

      <section aria-labelledby="orginfo" className="mb-6">
        <h2 id="orginfo" className="sr-only">
          Opplysninger om organisasjon
        </h2>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
          <div>
            <dt className="font-medium">Organisasjon</dt>
            <dd>{organization}</dd>
          </div>
          <div>
            <dt className="font-medium">
              <abbr title="organisasjonsnummer">Org.nr.</abbr>
            </dt>
            <dd>{orgNumber}</dd>
          </div>
          <div>
            <dt className="font-medium">Adresse</dt>
            <dd>{address}</dd>
          </div>
          <div>
            <dt className="font-medium">E‑post</dt>
            <dd>{email}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-medium">Redaktørs navn i blokkbokstaver</dt>
            <dd>{editorName}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-medium">Telefon</dt>
            <dd>{editorPhone}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="erklaring" className="mb-6">
        <h2 id="erklaring" className="sr-only">
          Erklæring
        </h2>
        <p>Som redaktør på vegne av min organisasjon erklærer jeg:</p>
        <AffidavitClauses className="list-decimal space-y-2 pl-6" />
      </section>

      <section aria-labelledby="signering" className="mt-8">
        <h2 id="signering" className="sr-only">
          Signering
        </h2>
        <p>
          <span className="font-medium">Sted:</span> <span aria-hidden>________________</span>{" "}
          <span className="font-medium">Dato:</span> <span aria-hidden>____________</span>
        </p>
        <p>
          <span className="font-medium">Redaktørens signatur:</span>{" "}
          <span aria-hidden>____________________________________________</span>
        </p>
      </section>
    </article>
  );
}
