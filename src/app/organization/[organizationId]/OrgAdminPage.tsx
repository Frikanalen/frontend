"use client";
import { Organization, User } from "@/generated/frikanalenDjangoAPI.schemas";
import { Button, Link } from "@heroui/react";

import { OutstandingVideosList } from "@/app/profile/OutstandingVideosList";

export const OrgAdminPage = ({
  organization,
  profile,
}: {
  organization: Organization;
  profile: User;
}) => {
  return (
    <main className="w-full max-w-5xl p-2">
      <section className="gap-4 flex flex-col bg-content2 text-content1-foreground rounded-xl p-4">
        <h1 className={"text-2xl font-bold"}>{organization.name}</h1>
        <h2>Redaktør {organization.editorName}</h2>
        <h3>Logget inn som {profile.email}</h3>
        <OutstandingVideosList organizationId={organization.id} />
        <Button
          as={Link}
          href={`/organization/${organization.id}`}
          color="primary"
          size="md"
        >
          Vis organisasjonssiden
        </Button>
      </section>
    </main>
  );
};
