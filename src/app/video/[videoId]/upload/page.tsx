import { getCookiesFromRequest } from "@/lib/getCookiesFromRequest";
import { videosRetrieve, videosUploadTokenRetrieve } from "@/generated/videos/videos";
import { profileIsAdminOrMember } from "@/app/organization/[organizationId]/admin/profileIsAdminOrMember";
import { forbidden } from "next/navigation";
import { VideoParams, parseParamsOr404 } from "@/lib/routeParams";

import { StudioBar } from "@/app/organization/[organizationId]/StudioBar";
import { StudioHeader } from "@/app/organization/[organizationId]/StudioHeader";
import { getUserOrNull } from "@/app/getUserOrNull";
import { FileUpload } from "@/components/upload/FileUpload";

// Per-visitor: rendered on request, without a static shell of its own.
export const instant = false;

export default async function Page({ params }: { params: Promise<{ videoId: string }> }) {
  const { videoId } = await parseParamsOr404(VideoParams, params);
  const headers = await getCookiesFromRequest();

  const { data: video } = await videosRetrieve(videoId, { headers });
  const user = await getUserOrNull(headers);
  const mayEdit = !!user?.isStaff || profileIsAdminOrMember(video.organization.id, user);
  if (!mayEdit) return forbidden();
  const { data: uploadToken } = await videosUploadTokenRetrieve(videoId, {
    headers,
  });

  const studio = `/organization/${video.organization.id}/admin`;

  return (
    <>
      <StudioBar organizationId={video.organization.id} section="videos" />
      <div className="mx-auto w-full max-w-7xl px-4 pt-8 sm:px-6">
        <section className="bg-background p-4 text-foreground sm:p-6">
          <StudioHeader
            title={video.name}
            intro="Last opp originalfilen. La siden være åpen til filen er overført."
            back={{ href: studio, label: "Videoer" }}
          />
          <FileUpload
            videoId={videoId}
            uploadEndpoint={uploadToken.uploadUrl}
            uploadToken={uploadToken.uploadToken}
            doneHref={`/video/${videoId}/edit`}
          />
        </section>
      </div>
    </>
  );
}
