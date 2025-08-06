"use client";
import { SimpleOrg } from "@/generated/frikanalenDjangoAPI.schemas";
import { Button, Card, CardBody, CardHeader } from "@heroui/react";
import Link from "next/link";
import { useRouter } from "next/navigation"; // organization can have different states:
import { useEffect } from "react";
// - dues not paid
// - paperwork not filed
// these should be flagged for the user to see.
// could be stored in db as a list of organization inhibitions/warnings?
const videoUploadLink = (id: number) => `/organization/${id}/upload`;

export const OrgList = ({
  memberOf,
  editorOf,
}: {
  memberOf: readonly SimpleOrg[];
  editorOf: readonly SimpleOrg[];
}) => {
  const router = useRouter();
  useEffect(() => {
    memberOf.map(({ id }) => router.prefetch(videoUploadLink(id)));
  }, [memberOf, router]);

  return (
    <div className="p-2">
      <div className="flex flex-col gap-4">
        {memberOf.map((org) => {
          return (
            <Card key={org.id} className={"basis-48"}>
              <CardHeader className={"font-bold"}>{org.name}</CardHeader>
              <CardBody className={"flex flex-col justify-between"}>
                <div>
                  {editorOf.map(({ id }) => id).includes(org.id)
                    ? "Redaktør"
                    : "Medlem"}
                </div>
                <div className="flex flex-col justify-end items-end">
                  <div>
                    <Button
                      as={Link}
                      href={videoUploadLink(org.id)}
                      color="primary"
                      size="md"
                    >
                      Last opp video!
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
