"use client";
import type { Video, VideoFiles } from "@/generated/frikanalenDjangoAPI.schemas";
import VideoPlayer from "@/components/stream/VideoPlayer";
import { notFound } from "next/navigation";
import {
  DASH_VIDEO_TYPES,
  VIDEO_TYPES,
  type DASHMimeType,
  type DASHSrc,
  type VideoMimeType,
  type VideoSrc,
} from "@vidstack/react";
import { VideoCardMeta } from "@/app/video/[videoId]/VideoCardMeta";

// Ordered by preference: vidstack plays the first source it finds a provider for,
// so DASH wins wherever Media Source Extensions are available and the progressive
// files serve as the fallback everywhere else — WebM ahead of the ageing Theora.
const playbackPreference = [
  "dash",
  "dashPreview",
  "webmMed",
  "theora",
] as const satisfies readonly (keyof VideoFiles)[];

// A bare `video/ogg` isn't enough to choose by: browsers that play Ogg audio but not Theora video
// (Safari, and Chrome since it dropped Theora) answer "maybe" and then play the file as sound only.
// Naming the codecs lets vidstack's `canPlayType` check pass over the file in those browsers.
// vidstack types `type` as a bare MIME type but hands it to `canPlayType` as is, and still
// recognises the file as video by its `.ogv` extension.
const codecs: Partial<Record<(typeof playbackPreference)[number], string>> = {
  theora: "theora, vorbis",
};

const isVidstackVideoMimeType = (
  mimeType: string | null,
): mimeType is VideoMimeType | DASHMimeType =>
  mimeType !== null && (VIDEO_TYPES.has(mimeType) || DASH_VIDEO_TYPES.has(mimeType));

export const djangoVideoFilesToVidstackSrcList = (videoFiles: VideoFiles): (VideoSrc | DASHSrc)[] =>
  playbackPreference.flatMap((variant) => {
    const file = videoFiles[variant];
    if (!file || !isVidstackVideoMimeType(file.mimeType)) return [];

    const codec = codecs[variant];
    const type = codec
      ? (`${file.mimeType}; codecs="${codec}"` as typeof file.mimeType)
      : file.mimeType;

    return [{ type, src: file.url }];
  });

export const VideoCard = ({ video, startTime }: { video: Video; startTime?: number }) => {
  if (!video.organization.fkmember) return notFound();
  return (
    <div className="space-y-4 bg-background text-foreground rounded-xl">
      <VideoPlayer
        title={video.name}
        src={djangoVideoFilesToVidstackSrcList(video.files)}
        poster={video.files.largeThumb?.url}
        startTime={startTime}
      />
      <VideoCardMeta video={video} />
    </div>
  );
};
