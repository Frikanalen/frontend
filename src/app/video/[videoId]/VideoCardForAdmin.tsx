"use client";
import { Video } from "@/generated/frikanalenDjangoAPI.schemas";
import { notFound } from "next/navigation";
import VideoPlayer from "@/components/stream/VideoPlayer";
import { djangoVideoFilesToVidstackSrcList } from "@/app/video/[videoId]/VideoCard";
import { VideoCardMeta } from "@/app/video/[videoId]/VideoCardMeta";
import { Progress } from "@heroui/react";
import { Alert } from "@heroui/alert";
import { useVideosRetrieve } from "@/generated/videos/videos";
import { POLL_INTERVAL_MS, useIngestProgress } from "@/lib/upload/useIngestProgress";

export const VideoCardForAdmin = ({
  video: initialVideo,
  startTime,
}: {
  video: Video;
  startTime?: number;
}) => {
  const initialVideoFiles = djangoVideoFilesToVidstackSrcList(initialVideo.files);
  const shouldPoll = Boolean(initialVideo.files.dashPreview) || !initialVideoFiles.length;
  const { data: videoResponse } = useVideosRetrieve(initialVideo.id, {
    query: {
      enabled: shouldPoll,
      refetchInterval: (query) => (query.state.data?.data.files.dash ? false : POLL_INTERVAL_MS),
    },
  });
  const video = videoResponse?.data ?? initialVideo;
  const videoFiles = djangoVideoFilesToVidstackSrcList(video.files);
  const mediaPending = !videoFiles.length;
  const previewPlaying = Boolean(video.files.dashPreview && !video.files.dash);
  const { description } = useIngestProgress(video.id, previewPlaying || mediaPending);

  if (!video.organization.fkmember) return notFound();
  return (
    <div className="space-y-4 bg-background text-foreground rounded-xl">
      <VideoPlayer
        key={videoFiles[0] ? String(videoFiles[0].src) : "pending"}
        title={video.name}
        src={videoFiles}
        poster={video.files.largeThumb?.url}
        mediaPending={mediaPending}
        startTime={startTime}
      />

      {previewPlaying && (
        <div className="space-y-3">
          <p>
            Du ser en foreløpig visningskopi i lavere kvalitet. Videoen behandles fortsatt og byttes
            automatisk til full kvalitet når den er klar.
          </p>
          {description?.phase === "failed" ? (
            <Alert color="danger">{description.message}</Alert>
          ) : description?.phase === "stalled" ? (
            <Alert color="warning">{description.message}</Alert>
          ) : (
            <Progress
              value={description?.percentage ?? undefined}
              isIndeterminate={description?.percentage == null}
              showValueLabel={description?.percentage != null}
              label={description?.message ?? "Lager video i full kvalitet..."}
            />
          )}
        </div>
      )}

      <VideoCardMeta video={video} />
    </div>
  );
};
