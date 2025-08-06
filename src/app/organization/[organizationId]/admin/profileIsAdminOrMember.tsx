import { User } from "@/generated/frikanalenDjangoAPI.schemas";

export const profileIsAdminOrMember = (
  organizationId: string,
  profile: User | null,
) =>
  !!profile &&
  [...profile.editorOf, ...profile.memberOf].some(
    ({ id }) => id.toString() === organizationId,
  );
