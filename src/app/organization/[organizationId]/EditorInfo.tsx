"use client";
import { Organization } from "@/generated/frikanalenDjangoAPI.schemas";
import { Accordion, AccordionItem } from "@heroui/react";

export const EditorInfo = ({ organization }: { organization: Organization }) => (
  <Accordion>
    <AccordionItem title={"Redaktørinformasjon"}>
      <div className={"flex gap-1 flex-col"}>
        <div className={"flex gap-4"}>
          <p className={"basis-64 text-right"}>Redaktør:</p>
          <p>{organization.editorName}</p>
        </div>
        <div className={"flex gap-4"}>
          <p className={"basis-64 text-right"}>Epost:</p>
          <p>{organization.editorEmail}</p>
        </div>

        <div className={"flex gap-4 whitespace-pre"}>
          <p className={"basis-64 text-right"}>Postadresse:</p>
          <p>{organization.postalAddress}</p>
        </div>
        <div className={"flex gap-4 whitespace-pre"}>
          <p className={"basis-64 text-right"}>Besøksadresse:</p>
          <p>{organization.streetAddress}</p>
        </div>
      </div>
    </AccordionItem>
  </Accordion>
);
