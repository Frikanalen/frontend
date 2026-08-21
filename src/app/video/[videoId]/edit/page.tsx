import { getCookiesFromRequest } from "@/lib/getCookiesFromRequest";
import { ssrVideosRetrieve } from "@/generated/ssr/videos/videos";
import { forbidden, notFound } from "next/navigation";
import { getUserOrNull } from "@/app/getUserOrNull";
import { VideoPageProps } from "@/app/video/[videoId]/page";
import { VideoEditForm } from "@/app/video/[videoId]/edit/VideoEditForm";
import { ProgramImageManager } from "@/app/video/[videoId]/edit/ProgramImageManager";
import { ssrProgramImagesList } from "@/generated/ssr/program-images/program-images";
import { ssrSeriesList } from "@/generated/ssr/series/series";
import { ssrVideosUploadTokenRetrieve } from "@/generated/ssr/videos/videos";

export default async function Page({ params }: VideoPageProps) {
  const { videoId } = await params;
  const headers = await getCookiesFromRequest();
  const user = await getUserOrNull(headers);

  const { data: video, status } = await ssrVideosRetrieve(videoId, {
    headers,
    cache: "no-store",
  });

  if (status === 404) return notFound();

  if (status !== 200)
    throw new Error(
      `Unexpected status code ${status} when fetching video ${videoId} from ssrVideosRetrieve`,
    );
  if (!user?.editorOf.some(({ id }) => id == video.organization.id)) return forbidden();

  const [seriesResponse, imagesResponse, uploadTokenResponse] = await Promise.all([
    ssrSeriesList(
      { organization: video.organization.id, limit: 100 },
      { headers, cache: "no-store" },
    ),
    ssrProgramImagesList({ video_id: Number(videoId), limit: 100 }, { headers, cache: "no-store" }),
    ssrVideosUploadTokenRetrieve(videoId, { headers, cache: "no-store" }),
  ]);
  if (seriesResponse.status !== 200)
    throw new Error(`Unexpected status ${seriesResponse.status} when fetching series`);
  if (imagesResponse.status !== 200)
    throw new Error(`Could not load images for video ${videoId}: ${imagesResponse.status}`);
  if (uploadTokenResponse.status !== 200)
    throw new Error(`Could not get an upload token for video ${videoId}`);
  const uploadToken = uploadTokenResponse.data.uploadToken;
  if (!uploadToken) throw new Error(`No upload token returned for video ${videoId}`);

  return (
    <section className={"bg-background rounded-md shadow-lg p-8 space-y-3"}>
      <div className={"prose dark:prose-invert"}>
        <h2>Rediger video</h2>
      </div>
      <VideoEditForm video={video} series={seriesResponse.data.results} />
      <ProgramImageManager
        videoId={videoId}
        uploadEndpoint={uploadTokenResponse.data.uploadUrl}
        uploadToken={uploadToken}
        initialImages={imagesResponse.data.results}
      />
    </section>
  );
}
