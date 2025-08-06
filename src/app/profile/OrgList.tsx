"use client";
import { SimpleOrg } from "@/generated/frikanalenDjangoAPI.schemas";
import { Button } from "@heroui/react";
import Link from "next/link";
import { useRouter } from "next/navigation"; // organization can have different states:
import { useEffect } from "react";
// - dues not paid
// - paperwork not filed
// these should be flagged for the user to see.
// could be stored in db as a list of organization inhibitions/warnings?
const orgAdminLink = (id: number) => `/organization/${id}/admin`;
const orgPageLink = (id: number) => `/organization/${id}`;

const UserOrgRole = ({
  org,
  isEditor,
}: {
  org: SimpleOrg;
  isEditor?: boolean;
}) => (
  <div key={org.id} className={"basis-24 border-l-2 pl-4 flex flex-col"}>
    <div className={"font-bold"}>{org.name}</div>
    <div className={"flex flex-col justify-between grow"}>
      {isEditor ? (
        <div>
          Du er <span className={"font-bold"}>redaktøren til</span> denne
          organisasjonen.
        </div>
      ) : (
        <div>Du er medlem av denne organisasjonen.</div>
      )}
      <div className="flex gap-2 justify-end">
        <Button as={Link} href={orgAdminLink(org.id)} color="primary" size="md">
          Rediger
        </Button>
        <Button as={Link} href={orgPageLink(org.id)} color="primary" size="md">
          Se offentlig side
        </Button>
      </div>
    </div>
  </div>
);
/**
 * Merge two arrays of “org entries” so that:
 *  - you end up with one entry per org.id
 *  - if an org appears in both lists, editor takes precedence
 */
function mergeOrgs(
  memberOf: readonly SimpleOrg[],
  editorOf: readonly SimpleOrg[],
): (SimpleOrg & { isEditor: boolean })[] {
  // build a Map from memberships
  const byId = new Map(
    memberOf.map((org) => [org.id, { ...org, isEditor: false }]),
  );

  // 2. override (or add) each ownership entry
  editorOf.forEach((org) => byId.set(org.id, { ...org, isEditor: true }));

  // 3. turn it back into an array
  return Array.from(byId.values());
}
export const OrgList = ({
  memberOf,
  editorOf,
}: {
  memberOf: readonly SimpleOrg[];
  editorOf: readonly SimpleOrg[];
}) => {
  const router = useRouter();
  useEffect(() => {
    memberOf.map(({ id }) => {
      router.prefetch(orgPageLink(id));
      router.prefetch(orgAdminLink(id));
    });
  }, [memberOf, router]);

  const memberships = mergeOrgs(memberOf, editorOf);

  return (
    <div className="p-2">
      <div className="flex flex-col gap-4">
        {memberships.map((org) => (
          <UserOrgRole org={org} key={org.id} isEditor={org.isEditor} />
        ))}
      </div>
    </div>
  );
};
