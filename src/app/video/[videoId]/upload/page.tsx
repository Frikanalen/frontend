import { getCookiesFromRequest } from "@/app/profile/getCookiesFromRequest";
import {
  videosRetrieve,
  videosUploadTokenRetrieve,
} from "@/generated/videos/videos";
import { userRetrieve } from "@/generated/user/user";
import { profileIsAdminOrMember } from "@/app/organization/[organizationId]/admin/profileIsAdminOrMember";
import { forbidden } from "next/navigation";

import { ModalIshPrototype } from "@/app/profile/ModalIshPrototype";

export default async function Page({
  params,
}: {
  params: Promise<{ videoId: string }>;
}) {
  const { videoId } = await params;
  const headers = await getCookiesFromRequest();

  const { data: video } = await videosRetrieve(videoId, { headers });
  const { data: user } = await userRetrieve({ headers });
  const mayEdit = profileIsAdminOrMember(
    video.organization.id.toString(),
    user,
  );
  const { data: uploadToken } = await videosUploadTokenRetrieve(videoId, {
    headers,
  });

  console.log(uploadToken);
  if (!mayEdit) return forbidden();
  return (
    <ModalIshPrototype>
      Todo: <h2>Upload file for video</h2>
    </ModalIshPrototype>
  );
}
