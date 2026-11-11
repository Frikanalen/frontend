"use client";
import { Notice } from "@/components/Notice";
import Link from "next/link";
/** A little widget to inform the user that they are an organization admin */
export const AdminAlert = ({ organizationId }: { organizationId: number }) => {
  return (
    <Notice status={"warning"}>
      <div className="flex flex-col gap-1">
        <h3 className={"font-bold"}>Slik ser andre siden</h3>
        <p>
          Dette er organisasjonens offentlige profil hos Frikanalen, slik alle andre ser den. Bare
          publiserte videoer vises her - dine upubliserte finner du på administratorsiden.
        </p>
        <div></div>
        <Link
          className={"font-semibold text-link hover:underline"}
          href={`/organization/${organizationId}/admin`}
        >
          Gå til administratorside
        </Link>
      </div>
    </Notice>
  );
};
