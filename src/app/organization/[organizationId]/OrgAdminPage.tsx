"use client";

import { Organization } from "@/generated/frikanalenDjangoAPI.schemas";
import { OutstandingVideosList } from "@/app/organization/[organizationId]/OutstandingVideosList";
import { OrgVideosList } from "@/app/organization/[organizationId]/OrgVideosList";

export const OrgAdminPage = ({ organization }: { organization: Organization }) => (
  <section className="flex flex-col gap-4">
    <div>
      <h1 className="text-3xl font-bold tracking-tight">{organization.name}</h1>
      <p className="text-default-600">Redaktør {organization.editorName}</p>
    </div>
    <OutstandingVideosList organizationId={organization.id} />
    <OrgVideosList organizationId={organization.id} />
  </section>
);
