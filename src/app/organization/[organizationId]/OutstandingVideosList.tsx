"use client";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { useVideosList } from "@/generated/videos/videos";
import type { Video } from "@/generated/frikanalenDjangoAPI.schemas";
import { VideoList } from "@/app/video/VideoList";
import { IngestStatusChip } from "@/app/organization/[organizationId]/IngestStatusChip";
import { useVideoDeletion } from "@/app/organization/[organizationId]/useVideoDeletion";
import { VideoRowMenu } from "@/app/organization/[organizationId]/VideoRowMenu";
import { ButtonLink } from "@/components/ButtonLink";
import { inOsloTime } from "@/lib/osloTime";

/** A live programme airs from its source until it has a file: nothing is wrong. */
export const isLiveProgramme = (video: Pick<Video, "liveSource">) => video.liveSource != null;

/**
 * A live programme with no airing left and no file: it went out live without
 * being recorded (or was never booked). Nothing to upload, so it is listed
 * under Direktesending rather than among the videos still being worked on.
 */
export const isPastLiveProgramme = (video: Pick<Video, "liveSource" | "liveAirings">) =>
  isLiveProgramme(video) && !video.liveAirings?.length;

/** When a live programme next goes out, in words, or null if it has no airing booked. */
export const nextLiveAiring = (video: Pick<Video, "liveAirings">) => {
  const next = video.liveAirings?.[0];
  if (!next) return null;
  return format(inOsloTime(next.starttime), "EEEE d. MMMM 'kl.' HH:mm", { locale: nb });
};

/**
 * The organization's videos that have no watchable copy yet: uploads still
 * being processed, uploads that failed or were never made, and live
 * programmes waiting for their airing. Live programmes that have had their
 * airing are listed under Direktesending instead. Each row says where it stands, and
 * only a row that needs something done offers to upload.
 *
 * A separate list from the finished ones because the server draws the same
 * line: `proper_import=false` is exactly this list.
 */
export const OutstandingVideosList = ({ organizationId }: { organizationId: number }) => {
  const { remove, isRemoving, error } = useVideoDeletion();
  const { data } = useVideosList({
    organization: organizationId,
    proper_import: false,
    ordering: "-id",
    limit: 50,
  });
  const videos = (data?.data.results ?? []).filter((video) => !isPastLiveProgramme(video));

  if (!videos.length) return null;

  return (
    <section aria-labelledby="outstanding-heading" className="space-y-3">
      <h2 id="outstanding-heading" className="text-xl font-bold">
        Under arbeid
      </h2>

      <VideoList
        videos={videos}
        showOrganization={false}
        showCategory={false}
        href={(video) => `/video/${video.id}/edit`}
        status={(video) => {
          if (!isLiveProgramme(video)) return <IngestStatusChip videoId={video.id} />;
          const airing = nextLiveAiring(video) ?? "";
          return (
            <span className="rounded bg-brand-coral/15 px-2 py-0.5 text-xs font-semibold">
              Direkte · sendes {airing}
            </span>
          );
        }}
        actions={(video) => (
          <>
            {isLiveProgramme(video) ? null : (
              <ButtonLink href={`/video/${video.id}/edit`} size="sm">
                Last opp
              </ButtonLink>
            )}
            <VideoRowMenu
              video={video}
              isDeleting={isRemoving(video.id)}
              onDelete={() =>
                remove(video.id, video.name, `Slett «${video.name}»? Dette kan ikke angres.`)
              }
            />
          </>
        )}
      />

      {error && (
        <p role="alert" className="text-danger-700 text-sm">
          Videoen kunne ikke slettes: {error}
        </p>
      )}
    </section>
  );
};
