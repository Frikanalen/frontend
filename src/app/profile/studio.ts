import type { User } from "@/generated/frikanalenDjangoAPI.schemas";

/**
 * Where "Studio" in the channel bar takes a signed-in user. Most belong to
 * one organization, and go straight to its tools; with several, the choice
 * is made on Min side. Someone in no organization has no Studio yet.
 */
export const studioHref = (user: Pick<User, "memberOf" | "editorOf">): string | null => {
  const ids = new Set([...user.memberOf, ...user.editorOf].map(({ id }) => id));
  if (ids.size === 0) return null;
  if (ids.size === 1) return `/organization/${[...ids][0]}/admin`;
  return "/profile#organizations-heading";
};
