import { getCookiesFromRequest } from "@/app/profile/getCookiesFromRequest";
import {
  videosRetrieve,
  videosUploadTokenRetrieve,
} from "@/generated/videos/videos";
import { profileIsAdminOrMember } from "@/app/organization/[organizationId]/admin/profileIsAdminOrMember";
import { forbidden } from "next/navigation";

import { ModalIshPrototype } from "@/app/profile/ModalIshPrototype";
import { getUserOrNull } from "@/app/getUserOrNull";

export default async function Page({
  params,
}: {
  params: Promise<{ videoId: string }>;
}) {
  const { videoId } = await params;
  const headers = await getCookiesFromRequest();

  const { data: video } = await videosRetrieve(videoId, { headers });
  const user = await getUserOrNull(headers);
  const mayEdit = profileIsAdminOrMember(
    video.organization.id.toString(),
    user,
  );
  if (!mayEdit) return forbidden();
  const { data: uploadToken } = await videosUploadTokenRetrieve(videoId, {
    headers,
  });

  console.log(uploadToken);
  return (
    <ModalIshPrototype>
      Todo: <h2>Upload file for video</h2>
    </ModalIshPrototype>
  );
}
