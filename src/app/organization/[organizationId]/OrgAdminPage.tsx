"use client";
import { Organization } from "@/generated/frikanalenDjangoAPI.schemas";
import { Button, Link } from "@heroui/react";

import { OutstandingVideosList } from "@/app/profile/OutstandingVideosList";

export const OrgAdminPage = ({ organization }: { organization: Organization }) => {
  return (
    <section className="gap-4 flex flex-col p-4">
      <h1 className={"text-2xl font-bold"}>{organization.name}</h1>
      <h2>Redaktør {organization.editorName}</h2>
      <div className="flex flex-wrap gap-2">
        <Button as={Link} href={`/organization/${organization.id}`} color="primary" size="md">
          Gå til offentlig profil
        </Button>
        <Button
          as={Link}
          href={`/organization/${organization.id}/create`}
          color="primary"
          size="md"
        >
          Ny video
        </Button>
      </div>
      <OutstandingVideosList organizationId={organization.id} />
    </section>
  );
};
