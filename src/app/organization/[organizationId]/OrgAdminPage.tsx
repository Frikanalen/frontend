"use client";

import { Organization } from "@/generated/frikanalenDjangoAPI.schemas";
import { ButtonLink } from "@/components/ButtonLink";
import { OutstandingVideosList } from "@/app/organization/[organizationId]/OutstandingVideosList";
import { OrgVideosList } from "@/app/organization/[organizationId]/OrgVideosList";

export const OrgAdminPage = ({ organization }: { organization: Organization }) => (
  <section className="gap-4 flex flex-col p-4">
    <h1 className="text-2xl font-bold">{organization.name}</h1>
    <h2>Redaktør {organization.editorName}</h2>
    <div className="flex flex-wrap gap-2">
      <ButtonLink href={`/organization/${organization.id}`}>Gå til offentlig profil</ButtonLink>
      <ButtonLink href={`/organization/${organization.id}/create`}>Ny video</ButtonLink>
      <ButtonLink href={`/organization/${organization.id}/series`}>Administrer serier</ButtonLink>
      <ButtonLink href={`/organization/${organization.id}/schedule`}>
        Programmer sendeplanen
      </ButtonLink>
      <ButtonLink href={`/organization/${organization.id}/live`}>Sjekk direktesending</ButtonLink>
    </div>
    <OutstandingVideosList organizationId={organization.id} />
    <OrgVideosList organizationId={organization.id} />
  </section>
);
