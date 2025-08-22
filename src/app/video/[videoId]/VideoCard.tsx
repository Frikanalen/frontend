"use client";
import { Video } from "@/generated/frikanalenDjangoAPI.schemas";
import VideoPlayer from "@/components/stream/VideoPlayer";
import { notFound } from "next/navigation";
import { VideoMimeType, VideoSrc } from "@vidstack/react";
import { VideoCardMeta } from "@/app/video/[videoId]/VideoCardMeta";

type DjangoFormatFsname = "webmMed" | "theora";

const djangoToMimeTable: Record<DjangoFormatFsname, VideoMimeType> = {
  webmMed: "video/webm",
  theora: "video/ogg",
} as const;

export const djangoVideoFilesToVidstackSrcList = (videoFiles: {
  [key: string]: string;
}): VideoSrc[] =>
  (Object.entries(djangoToMimeTable) as [DjangoFormatFsname, VideoMimeType][])
    .filter(([fsname]) => !!videoFiles[fsname]?.length)
    .map(([fsname, mimetype]) => ({
      type: mimetype,
      src: videoFiles[fsname],
    }));

export const VideoCard = ({ video }: { video: Video }) => {
  if (!video.organization.fkmember) return notFound();
  return (
    <div className="space-y-4 bg-background text-foreground rounded-xl">
      <VideoPlayer
        title={video.name}
        src={djangoVideoFilesToVidstackSrcList(video.files)}
        poster={video.files.largeThumb}
      />
      <VideoCardMeta video={video} />
    </div>
  );
};
