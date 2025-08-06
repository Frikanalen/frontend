import { User } from "@/generated/frikanalenDjangoAPI.schemas";

export const profileIsAdminOrMember = (organizationId: string, profile: User) =>
  [...profile.editorOf, ...profile.memberOf].some(
    ({ id }) => id.toString() === organizationId,
  );
