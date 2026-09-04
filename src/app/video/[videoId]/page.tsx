import { VideoCard } from "@/app/video/[videoId]/VideoCard";
import { getCookiesFromRequest } from "@/lib/getCookiesFromRequest";
import { notFound } from "next/navigation";
import { profileIsAdminOrMember } from "@/app/organization/[organizationId]/admin/profileIsAdminOrMember";
import { getUserOrNull } from "@/app/getUserOrNull";
import { VideoCardForAdmin } from "@/app/video/[videoId]/VideoCardForAdmin";
import { ssrVideosRetrieve } from "@/generated/ssr/videos/videos";
import { Metadata } from "next";
import { VideoParams, parseParamsOr404 } from "@/lib/routeParams";
import { videoStartTimeFrom } from "@/app/video/[videoId]/videoStartTime";

export const revalidate = 60;

export interface VideoPageParams {
  videoId: string;
}

export type VideoPageProps = {
  params: Promise<VideoPageParams>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: VideoPageProps): Promise<Metadata> {
  const { videoId } = await parseParamsOr404(VideoParams, params);

  const { data: video, status } = await ssrVideosRetrieve(videoId, {
    cache: "no-store",
    next: { tags: [`video:${videoId}`] },
  });
  if (status !== 200)
    return {
      title: "Frikanalen",
    };

  return {
    title: `${video.name} - Frikanalen`,
    authors: {
      name: video.organization.name,
      url: `https://frikanalen.no/organization/${video.organization.id}`,
    },
    openGraph: {
      type: "video.episode",
      duration: video.durationSec,
      releaseDate: video.createdTime,
      url: `https://frikanalen.no/video/${video.id}`,
    },
    description: `Video av ${video.organization.name}: ${video.description || ""}`,
  };
}

export default async function VideoPage({ params, searchParams }: VideoPageProps) {
  const { videoId } = await parseParamsOr404(VideoParams, params);
  const startTime = videoStartTimeFrom((await searchParams).t);
  const headers = await getCookiesFromRequest();

  const { data: video, status } = await ssrVideosRetrieve(videoId, {
    headers,
    cache: "no-cache",
    next: { tags: [`video:${videoId}`] },
  });

  if (status === 404) return notFound();
  if (status !== 200)
    throw new Error(
      `Unexpected status code ${status} when fetching video ${videoId} from ssrVideosRetrieve`,
    );
  const user = await getUserOrNull(headers);
  const mayEdit = profileIsAdminOrMember(video.organization.id, user);

  return mayEdit ? (
    <VideoCardForAdmin video={video} startTime={startTime} />
  ) : (
    <VideoCard video={video} startTime={startTime} />
  );
}
