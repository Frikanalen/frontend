import { ssrVideosRetrieve } from "@/generated/ssr/videos/videos";

export const alt = "";
export const size = { width: 1200, height: 630 };

export const contentTypes = "image/jpeg";

export default async function Image({ params }: { params: Promise<{ videoId: string }> }) {
  const { videoId } = await params;

  const { data: video, status } = await ssrVideosRetrieve(videoId);
  if (status !== 200)
    throw new Error(
      `Unexpected status code ${status} when fetching video ${videoId} from ssrVideosRetrieve`,
    );

  return await fetch(video.files["largeThumb"]);
}
