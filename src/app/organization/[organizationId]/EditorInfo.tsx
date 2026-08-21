"use client";
import { Organization } from "@/generated/frikanalenDjangoAPI.schemas";
import { Accordion, AccordionItem, Link } from "@heroui/react";
import { ReactNode } from "react";

/**
 * One labelled fact, or nothing at all. A label with an empty value beside it
 * is worse than a missing row: it reads as information that failed to load
 * rather than information the organization never gave.
 */
const Row = ({ label, children }: { label: string; children: ReactNode }) =>
  children ? (
    <div className={"flex gap-4"}>
      <dt className={"basis-64 shrink-0 text-right"}>{label}</dt>
      <dd className={"whitespace-pre-line"}>{children}</dd>
    </div>
  ) : null;

export const EditorInfo = ({ organization }: { organization: Organization }) => (
  <Accordion>
    <AccordionItem title={"Redaktørinformasjon"}>
      <dl className={"flex gap-1 flex-col"}>
        <Row label={"Redaktør:"}>{organization.editorName?.trim()}</Row>
        <Row label={"Epost:"}>
          {organization.editorEmail?.trim() && (
            // A mailto rather than bare text: this is contact information the
            // editor is required to publish, so it should at least be usable
            // in one click by the people it is meant for.
            <Link href={`mailto:${organization.editorEmail.trim()}`} size={"sm"}>
              {organization.editorEmail.trim()}
            </Link>
          )}
        </Row>
        <Row label={"Postadresse:"}>{organization.postalAddress?.trim()}</Row>
        <Row label={"Besøksadresse:"}>{organization.streetAddress?.trim()}</Row>
      </dl>
    </AccordionItem>
  </Accordion>
);
