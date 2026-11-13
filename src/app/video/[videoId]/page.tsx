import { VideoCard } from "@/app/video/[videoId]/VideoCard";
import { notFound } from "next/navigation";
import { profileIsAdminOrMember } from "@/app/organization/[organizationId]/admin/profileIsAdminOrMember";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { cacheLife, cacheTag } from "next/cache";
import { Suspense } from "react";
import { cacheableResponse } from "@/lib/cacheableResponse";
import { VideoCardForAdmin } from "@/app/video/[videoId]/VideoCardForAdmin";
import { ssrVideosRetrieve } from "@/generated/ssr/videos/videos";
import { Metadata } from "next";
import { VideoParams, parseParamsOr404 } from "@/lib/routeParams";
import { videoStartTimeFrom } from "@/app/video/[videoId]/videoStartTime";
import { SuspendedNotice, suspendedOrganizationFrom } from "@/components/suspended/SuspendedNotice";

/**
 * A video as a visitor sees it, shared by every visitor and by the page and
 * its metadata for a minute. Asked anonymously, since the video API answers
 * everyone alike; whether to show a member the processing view is decided per
 * request below. Saving in the editor expires it at once.
 * Statuses come back as answers, so a missing video is cached as missing; a
 * failure to reach the API throws and isn't cached.
 */
const loadVideo = async (videoId: number) => {
  "use cache";
  cacheLife("minutes");
  cacheTag(`video:${videoId}`);

  return cacheableResponse(await ssrVideosRetrieve(videoId));
};

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

export default function VideoPage(props: VideoPageProps) {
  // Which video, the ?t= offset and who is asking are all per request, so
  // the page streams in behind the layout's static shell, from the cache
  // above. A visitor without a session costs no call to Django at all.
  return (
    <Suspense>
      <Video {...props} />
    </Suspense>
  );
}

const Video = async ({ params, searchParams }: VideoPageProps) => {
  const { videoId } = await parseParamsOr404(VideoParams, params);
  const startTime = videoStartTimeFrom((await searchParams).t);

  const [{ data: video, status }, user] = await Promise.all([loadVideo(videoId), getCurrentUser()]);

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
};
