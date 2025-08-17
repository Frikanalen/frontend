import { VideoCard } from "@/app/video/[videoId]/videoCard";
import { getCookiesFromRequest } from "@/app/profile/getCookiesFromRequest";
import { videosRetrieve } from "@/generated/videos/videos";
import { notFound } from "next/navigation";
import { profileIsAdminOrMember } from "@/app/organization/[organizationId]/admin/profileIsAdminOrMember";
import { getUserOrNull } from "@/app/getUserOrNull";
import { VideoCardForAdmin } from "@/app/video/[videoId]/VideoCardForAdmin";

export default async function VideoPage({ params }: { params: Promise<{ videoId: string }> }) {
  const { videoId } = await params;
  const headers = await getCookiesFromRequest();

  const { data: video, status } = await videosRetrieve(videoId, {
    headers,
    validateStatus: () => true,
  });
  if (status === 404) {
    notFound();
  }

  const user = await getUserOrNull(headers);

  const mayEdit = profileIsAdminOrMember(video.organization.id, user);

  if (status === 404) return notFound();

  return (
    <main className="w-full max-w-5xl grow px-2">
      {mayEdit ? <VideoCardForAdmin video={video} /> : <VideoCard video={video} />}
    </main>
  );
}
