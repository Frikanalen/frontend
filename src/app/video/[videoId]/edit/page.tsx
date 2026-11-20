import { getCookiesFromRequest } from "@/lib/getCookiesFromRequest";
import {
  ssrVideosImagesList,
  ssrVideosRetrieve,
  ssrVideosUploadTokenRetrieve,
} from "@/generated/ssr/videos/videos";
import { ssrOrganizationLiveSourcesList } from "@/generated/ssr/organization/organization";
import { forbidden, notFound, redirect } from "next/navigation";
import { profileIsAdminOrMember } from "@/app/organization/[organizationId]/admin/profileIsAdminOrMember";
import { getUserOrNull } from "@/app/getUserOrNull";
import { VideoPageProps } from "@/app/video/[videoId]/page";
import { VideoEditForm } from "@/app/video/[videoId]/edit/VideoEditForm";
import { VideoUploadPanel } from "@/app/video/[videoId]/edit/VideoUploadPanel";
import { ProgramImageManager } from "@/app/video/[videoId]/edit/ProgramImageManager";
import { ssrSeriesList } from "@/generated/ssr/series/series";
import { ssrCategoriesList } from "@/generated/ssr/categories/categories";
import Link from "next/link";
import { VideoParams, parseParamsOr404 } from "@/lib/routeParams";
import { StudioBar } from "@/app/organization/[organizationId]/StudioBar";
import { StudioHeader } from "@/app/organization/[organizationId]/StudioHeader";

// Per-visitor: rendered on request, without a static shell of its own.
export const instant = false;

export default async function Page({ params }: VideoPageProps) {
  const { videoId } = await parseParamsOr404(VideoParams, params);
  const headers = await getCookiesFromRequest();
  const user = await getUserOrNull(headers);

  const { data: video, status } = await ssrVideosRetrieve(videoId, {
    headers,
    cache: "no-store",
  });

  if (status === 404) return notFound();
  // Removed by staff, or from a suspended organization: the video page
  // says which, and there is nothing here to edit.
  if (status === 403) redirect(`/video/${videoId}`);

  if (status !== 200)
    throw new Error(
      `Unexpected status code ${status} when fetching video ${videoId} from ssrVideosRetrieve`,
    );
  // Same people the API lets change the video: staff, and the organization's
  // editor and members.
  if (!user?.isStaff && !profileIsAdminOrMember(video.organization.id, user)) return forbidden();

  const [
    seriesResponse,
    imagesResponse,
    uploadTokenResponse,
    liveSourcesResponse,
    categoriesResponse,
  ] = await Promise.all([
    ssrSeriesList(
      { organization: video.organization.id, limit: 100 },
      { headers, cache: "no-store" },
    ),
    ssrVideosImagesList(videoId, { limit: 100 }, { headers, cache: "no-store" }),
    ssrVideosUploadTokenRetrieve(videoId, { headers, cache: "no-store" }),
    ssrOrganizationLiveSourcesList(video.organization.id, { headers, cache: "no-store" }),
    ssrCategoriesList({ limit: 100 }, { headers, cache: "no-store" }),
  ]);
  if (seriesResponse.status !== 200)
    throw new Error(`Unexpected status ${seriesResponse.status} when fetching series`);
  if (imagesResponse.status !== 200)
    throw new Error(`Could not load images for video ${videoId}: ${imagesResponse.status}`);
  if (uploadTokenResponse.status !== 200)
    throw new Error(`Could not get an upload token for video ${videoId}`);
  const uploadToken = uploadTokenResponse.data.uploadToken;
  if (!uploadToken) throw new Error(`No upload token returned for video ${videoId}`);

  const studio = `/organization/${video.organization.id}/admin`;

  return (
    <>
      <StudioBar organizationId={video.organization.id} section="videos" />
      <div className="mx-auto w-full max-w-7xl px-4 pt-8 sm:px-6">
        <section className="bg-background p-4 text-foreground sm:p-6">
          <StudioHeader
            title={video.name}
            back={{ href: studio, label: "Videoer" }}
            action={
              <Link className="font-semibold text-link hover:underline" href={`/video/${videoId}`}>
                Se offentlig side ↗
              </Link>
            }
          />
          <VideoUploadPanel
            videoId={videoId}
            uploadEndpoint={uploadTokenResponse.data.uploadUrl}
            uploadToken={uploadToken}
            needsFile={!video.properImport && video.liveSource == null}
          />
          <VideoEditForm
            image={
              <ProgramImageManager
                videoId={videoId}
                uploadEndpoint={uploadTokenResponse.data.uploadUrl}
                uploadToken={uploadToken}
                initialImages={imagesResponse.data.results}
                fallbackThumbnail={video.files.largeThumb?.url}
              />
            }
            categories={categoriesResponse.status === 200 ? categoriesResponse.data.results : []}
            liveSources={liveSourcesResponse.status === 200 ? liveSourcesResponse.data : []}
            returnHref={studio}
            series={seriesResponse.data.results}
            video={video}
          />
        </section>
      </div>
    </>
  );
}
