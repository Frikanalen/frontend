import type { AffidavitSubmission } from "@/generated/frikanalenDjangoAPI.schemas";

/**
 * Where the organization's declaration stands, from its uploads (newest
 * first). An approved scan makes the organization a member, which the
 * onboarding steps read off the organization itself.
 */
export const latestAffidavitState = (
  submissions: readonly AffidavitSubmission[],
): "none" | "pending" | "rejected" => {
  const latest = submissions[0];
  if (latest?.status === "pending") return "pending";
  if (latest?.status === "rejected") return "rejected";
  return "none";
};
