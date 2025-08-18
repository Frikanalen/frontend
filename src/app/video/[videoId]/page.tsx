import { VideoCard } from "@/app/video/[videoId]/videoCard";
import { getCookiesFromRequest } from "@/app/profile/getCookiesFromRequest";
import { notFound } from "next/navigation";
import { profileIsAdminOrMember } from "@/app/organization/[organizationId]/admin/profileIsAdminOrMember";
import { getUserOrNull } from "@/app/getUserOrNull";
import { VideoCardForAdmin } from "@/app/video/[videoId]/VideoCardForAdmin";
import { ssrVideosRetrieve } from "@/generated/ssr/videos/videos";

export const revalidate = 60;

export default async function VideoPage({ params }: { params: Promise<{ videoId: string }> }) {
  const { videoId } = await params;
  const headers = await getCookiesFromRequest();

  const { data: video, status } = await ssrVideosRetrieve(videoId, {
    headers,
    cache: "no-store",
  });
  if (status === 404) return notFound();
  if (status !== 200)
    throw new Error(
      `Unexpected status code ${status} when fetching video ${videoId} from ssrVideosRetrieve`,
    );

  const user = await getUserOrNull(headers);

  const mayEdit = profileIsAdminOrMember(video.organization.id, user);

  return (
    <main className="w-full max-w-5xl grow px-2">
      {mayEdit ? <VideoCardForAdmin video={video} /> : <VideoCard video={video} />}
    </main>
  );
}
