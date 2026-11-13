import type { SimpleOrg } from "@/generated/frikanalenDjangoAPI.schemas";

export type Membership = SimpleOrg & { isEditor: boolean };

/**
 * One entry per organization, editor winning wherever a user holds both roles.
 *
 * Sorted by name so the list keeps its order between visits: the two arrays
 * arrive in whatever order the API happened to serialise them, and a list that
 * reshuffles under you is a list you have to re-read every time.
 */
export const mergeMemberships = (
  memberOf: readonly SimpleOrg[],
  editorOf: readonly SimpleOrg[],
): Membership[] => {
  const byId = new Map(memberOf.map((org) => [org.id, { ...org, isEditor: false }]));
  editorOf.forEach((org) => byId.set(org.id, { ...org, isEditor: true }));

  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, "nb"));
};

/** Where an organization's member tools start. */
export const studioHref = (organizationId: number) => `/organization/${organizationId}/admin`;
