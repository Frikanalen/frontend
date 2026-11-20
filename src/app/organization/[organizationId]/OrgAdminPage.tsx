"use client";

import { Organization } from "@/generated/frikanalenDjangoAPI.schemas";
import { OutstandingVideosList } from "@/app/organization/[organizationId]/OutstandingVideosList";
import { OrgVideosList } from "@/app/organization/[organizationId]/OrgVideosList";
import { StudioHeader } from "@/app/organization/[organizationId]/StudioHeader";

export const OrgAdminPage = ({ organization }: { organization: Organization }) => (
  <section className="flex flex-col gap-6">
    <StudioHeader
      title="Videoer"
      intro="Alt dere har lastet opp, også det som er skjult eller fortsatt under arbeid."
    />
    <OutstandingVideosList organizationId={organization.id} />
    <OrgVideosList organizationId={organization.id} />
  </section>
);
