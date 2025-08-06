import { VideoCard } from "@/app/video/[videoId]/videoCard";
import { getVideo } from "@/lib/repo/getVideo";

export default async function VideoPage({
  params,
}: {
  params: Promise<{ videoId: string }>;
}) {
  const { videoId } = await params;

  const video = await getVideo(videoId);

  return (
    <main className="w-full max-w-5xl grow px-2">
      <VideoCard video={video} />
    </main>
  );
}
