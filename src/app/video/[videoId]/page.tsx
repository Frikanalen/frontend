import { VideoCard } from "@/app/video/[videoId]/VideoCard";
import { getCookiesFromRequest } from "@/lib/getCookiesFromRequest";
import { notFound } from "next/navigation";
import { profileIsAdminOrMember } from "@/app/organization/[organizationId]/admin/profileIsAdminOrMember";
import { getUserOrNull } from "@/app/getUserOrNull";
import { VideoCardForAdmin } from "@/app/video/[videoId]/VideoCardForAdmin";
import { loadVideo } from "@/app/video/[videoId]/loadVideo";
import { Metadata } from "next";
import { VideoParams, parseParamsOr404 } from "@/lib/routeParams";
import { videoStartTimeFrom } from "@/app/video/[videoId]/videoStartTime";
import { SuspendedNotice, suspendedOrganizationFrom } from "@/components/suspended/SuspendedNotice";

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

  const { data: video, status } = await loadVideo(videoId);
  if (status === 403) {
    const suspended = suspendedOrganizationFrom(video);
    if (suspended) return { title: `${suspended.name} er suspendert - Frikanalen` };
  }
  if (status !== 200)
    return {
      title: "Frikanalen",
    };

  return {
    title: `${video.name} - Frikanalen`,
    authors: {
      name: video.organization.name,
      url: `https://frikanalen.tv/organization/${video.organization.id}`,
    },
    openGraph: {
      type: "video.episode",
      duration: video.durationSec,
      releaseDate: video.createdTime,
      url: `https://frikanalen.tv/video/${video.id}`,
    },
    description: `Video av ${video.organization.name}: ${video.description || ""}`,
  };
}

export default async function VideoPage({ params, searchParams }: VideoPageProps) {
  const { videoId } = await parseParamsOr404(VideoParams, params);
  const startTime = videoStartTimeFrom((await searchParams).t);
  const headers = await getCookiesFromRequest();

  // Both at once: the user only decides which card to show, so there is no
  // reason to wait for the video before asking who is looking at it.
  const [{ data: video, status }, user] = await Promise.all([
    loadVideo(videoId),
    getUserOrNull(headers),
  ]);

  if (status === 404) return notFound();
  if (status === 403) {
    const suspended = suspendedOrganizationFrom(video);
    if (suspended)
      return (
        // No <main> of its own: the video layout already provides it.
        <div className="mx-auto w-full max-w-5xl px-4 pt-10 sm:px-6">
          <SuspendedNotice organization={suspended} context="video" />
        </div>
      );
  }
  if (status !== 200)
    throw new Error(
      `Unexpected status code ${status} when fetching video ${videoId} from ssrVideosRetrieve`,
    );
  const mayEdit = profileIsAdminOrMember(video.organization.id, user);

  return mayEdit ? (
    <VideoCardForAdmin video={video} startTime={startTime} />
  ) : (
    <VideoCard video={video} startTime={startTime} />
  );
}
