"use client";
import { Video, VideoFileVariantEnum } from "@/generated/frikanalenDjangoAPI.schemas";
import VideoPlayer from "@/components/stream/VideoPlayer";
import { notFound } from "next/navigation";
import { DASHMimeType, DASHSrc, VideoMimeType, VideoSrc } from "@vidstack/react";
import { VideoCardMeta } from "@/app/video/[videoId]/VideoCardMeta";

type DjangoVariant = "dash" | "webmMed" | "theora";

// Ordered by preference: vidstack plays the first source it finds a provider for,
// so DASH wins wherever Media Source Extensions are available and the progressive
// files serve as the fallback everywhere else.
const djangoToMimeTable: Partial<Record<VideoFileVariantEnum, VideoMimeType | DASHMimeType>> = {
  dash: "application/dash+xml",
  theora: "video/ogg",
} as const;

export const djangoVideoFilesToVidstackSrcList = (videoFiles: {
  [key: string]: string;
}): (VideoSrc | DASHSrc)[] =>
  (Object.entries(djangoToMimeTable) as [DjangoVariant, VideoMimeType | DASHMimeType][])
    .filter(([variant]) => !!videoFiles[variant]?.length)
    .map(([variant, mimetype]) => ({
      type: mimetype,
      src: videoFiles[variant],
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
