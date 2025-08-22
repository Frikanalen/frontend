import { VideoCard } from "@/app/video/[videoId]/videoCard";
import { getCookiesFromRequest } from "@/app/profile/getCookiesFromRequest";
import { notFound } from "next/navigation";
import { profileIsAdminOrMember } from "@/app/organization/[organizationId]/admin/profileIsAdminOrMember";
import { getUserOrNull } from "@/app/getUserOrNull";
import { VideoCardForAdmin } from "@/app/video/[videoId]/VideoCardForAdmin";
import { ssrVideosRetrieve } from "@/generated/ssr/videos/videos";
import { Metadata } from "next";

export const revalidate = 60;

export interface VideoPageParams {
  videoId: string;
}

export type VideoPageProps = {
  params: Promise<VideoPageParams>;
};

export async function generateMetadata({ params }: VideoPageProps): Promise<Metadata> {
  const { videoId } = await params;

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
    description: `Video av ${video.organization.name}: ${video.header?.length ? video.header : video.description}`,
  };
}

export default async function VideoPage({ params }: VideoPageProps) {
  const { videoId } = await params;
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
  console.log(video.description);
  const user = await getUserOrNull(headers);
  const mayEdit = profileIsAdminOrMember(video.organization.id, user);

  return mayEdit ? <VideoCardForAdmin video={video} /> : <VideoCard video={video} />;
}
