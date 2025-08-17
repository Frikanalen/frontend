import { User } from "@/generated/frikanalenDjangoAPI.schemas";

export const profileIsAdminOrMember = (organizationId: number, profile: User | null) =>
  !!profile && [...profile.editorOf, ...profile.memberOf].some(({ id }) => id === organizationId);
