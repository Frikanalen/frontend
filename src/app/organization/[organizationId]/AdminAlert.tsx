"use client";
import { Alert } from "@heroui/alert";
import { Link } from "@heroui/react";

/** A little widget to inform the user that they are an organization admin */
export const AdminAlert = ({ organizationId }: { organizationId: string }) => {
  return (
    <Alert>
      <div className="flex flex-col gap-1">
        <div>Du er administrator.</div>
        <Link href={`/organization/${organizationId}/admin`}>
          Gå til administratorside
        </Link>
      </div>
    </Alert>
  );
};
