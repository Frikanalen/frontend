"use client";
import { Alert } from "@heroui/alert";
import { Link } from "@heroui/react";

/** A little widget to inform the user that they are an organization admin */
export const AdminAlert = ({ organizationId }: { organizationId: string }) => {
  return (
    <Alert variant={"faded"} color={"warning"}>
      <div className="flex flex-col gap-1 text-warning-600">
        <h3 className={"font-bold"}>OBS: Betaversjon</h3>
        <p>
          Dette er en forhåndsvisning av organisasjonens offentlige profil hos Frikanalen. Det kan
          være at videoer som ikke er synlige for offentligheten, likevel vil vises i f. eks.
          &raquot;nyeste videoer&laquot; her.
        </p>
        <div></div>
        <Link className={"text-warning-800"} href={`/organization/${organizationId}/admin`}>
          Gå til administratorside
        </Link>
      </div>
    </Alert>
  );
};
