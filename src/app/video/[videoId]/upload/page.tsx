import { getCookiesFromRequest } from "@/app/profile/getCookiesFromRequest";
import { videosRetrieve, videosUploadTokenRetrieve } from "@/generated/videos/videos";
import { profileIsAdminOrMember } from "@/app/organization/[organizationId]/admin/profileIsAdminOrMember";
import { forbidden } from "next/navigation";

import { ModalIshPrototype, ModalIshPrototypeBody } from "@/app/profile/ModalIshPrototype";
import { getUserOrNull } from "@/app/getUserOrNull";
import { FileUpload } from "@/components/upload/FileUpload";

export default async function Page({ params }: { params: Promise<{ videoId: string }> }) {
  const { videoId } = await params;
  const headers = await getCookiesFromRequest();

  const { data: video } = await videosRetrieve(videoId, { headers });
  const user = await getUserOrNull(headers);
  const mayEdit = profileIsAdminOrMember(video.organization.id, user);
  if (!mayEdit) return forbidden();
  const { data: uploadToken } = await videosUploadTokenRetrieve(videoId, {
    headers,
  });

  return (
    <ModalIshPrototype>
      <ModalIshPrototypeBody className={"space-y-4"}>
        <div className="prose dark:prose-invert">
          <h2>Last opp originalfil for {video.name}</h2>
        </div>
        <FileUpload
          videoId={videoId}
          uploadEndpoint={uploadToken.uploadUrl}
          uploadToken={uploadToken.uploadToken}
        />
      </ModalIshPrototypeBody>
    </ModalIshPrototype>
  );
}
