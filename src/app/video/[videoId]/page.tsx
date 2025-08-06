import { VideoCard } from "@/app/video/[videoId]/videoCard";
import { getCookiesFromRequest } from "@/app/profile/getCookiesFromRequest";
import { videosRetrieve } from "@/generated/videos/videos";
import { notFound, redirect } from "next/navigation";
import { userRetrieve } from "@/generated/user/user";
import { profileIsAdminOrMember } from "@/app/organization/[organizationId]/admin/profileIsAdminOrMember";

export default async function VideoPage({
  params,
}: {
  params: Promise<{ videoId: string }>;
}) {
  const { videoId } = await params;
  const headers = await getCookiesFromRequest();

  const { data: video, status } = await videosRetrieve(videoId, { headers });
  const { data: user } = await userRetrieve({ headers });

  const mayEdit = profileIsAdminOrMember(
    video.organization.id.toString(),
    user,
  );

  if (mayEdit && !video.properImport) redirect(`/video/${videoId}/upload`);

  if (status === 404) return notFound();

  return (
    <main className="w-full max-w-5xl grow px-2">
      {mayEdit ? <VideoCard video={video} /> : <VideoCard video={video} />}
    </main>
  );
}
