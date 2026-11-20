import type { AirtimeGrant } from "@/generated/frikanalenDjangoAPI.schemas";

/** How far ahead an empty grant starts to count as urgent. */
export const ATTENTION_WINDOW_MILLISECONDS = 48 * 3_600_000;

/**
 * The grants a member has to act on soon: still open to them, nothing set up,
 * no recipe that fills them on its own, and a deadline within two days. An
 * automatic grant fills itself, so an empty one is not a problem.
 */
export const grantsNeedingProgramme = (
  grants: readonly Pick<AirtimeGrant, "state" | "canEdit" | "recipe" | "items" | "locksAt">[],
  now: number = Date.now(),
) =>
  grants.filter(
    (grant) =>
      grant.state === "open" &&
      grant.canEdit &&
      grant.recipe === null &&
      grant.items.length === 0 &&
      Date.parse(grant.locksAt) > now &&
      Date.parse(grant.locksAt) - now <= ATTENTION_WINDOW_MILLISECONDS,
  ).length;
