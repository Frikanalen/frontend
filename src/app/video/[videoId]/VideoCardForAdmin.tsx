"use client";
import { Video } from "@/generated/frikanalenDjangoAPI.schemas";
import { notFound, useRouter } from "next/navigation";
import VideoPlayer from "@/components/stream/VideoPlayer";
import { djangoVideoFilesToVidstackSrcList } from "@/app/video/[videoId]/VideoCard";
import { useTimeoutFn } from "react-use";
import { revalidateVideoAction } from "@/components/stream/revalidateVideoAction";
import { VideoCardMeta } from "@/app/video/[videoId]/VideoCardMeta";

export const VideoCardForAdmin = ({ video: video }: { video: Video }) => {
  const videoFiles = djangoVideoFilesToVidstackSrcList(video.files);
  const mediaPending = !videoFiles.length;
  const router = useRouter();

  useTimeoutFn(() => {
    if (mediaPending) {
      revalidateVideoAction(video.id.toString()).then(() => {
        router.refresh();
      });
    }
  }, 30000);

  if (!video.organization.fkmember) return notFound();
  return (
    <div className="bg-background text-foreground rounded-xl">
      <VideoPlayer
        title={video.name}
        src={videoFiles}
        poster={video.files.largeThumb}
        mediaPending={mediaPending}
      />
      <VideoCardMeta video={video} />
    </div>
  );
};
