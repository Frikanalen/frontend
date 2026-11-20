"use client";
import Link from "next/link";
import { useVideosList } from "@/generated/videos/videos";
import type { Video } from "@/generated/frikanalenDjangoAPI.schemas";
import {
  isLiveProgramme,
  isPastLiveProgramme,
  nextLiveAiring,
} from "@/app/organization/[organizationId]/OutstandingVideosList";
import { useVideoDeletion } from "@/app/organization/[organizationId]/useVideoDeletion";
import { VideoRowMenu } from "@/app/organization/[organizationId]/VideoRowMenu";

const Row = ({ video, note, menu }: { video: Video; note: string; menu?: React.ReactNode }) => (
  <li className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-default-200 py-3">
    <div className="min-w-0 grow">
      <Link className="font-semibold hover:underline" href={`/video/${video.id}/edit`}>
        {video.name}
      </Link>
      <p className="text-sm text-default-600">{note}</p>
    </div>
    {menu}
  </li>
);

/**
 * The organization's live programmes: those booked to go out, and those that
 * went out live without being recorded. The latter have no file and never
 * will, so they belong here and not among the videos waiting for an upload.
 */
export const LiveProgrammes = ({ organizationId }: { organizationId: number }) => {
  const { remove, isRemoving, error } = useVideoDeletion();
  // A live programme has no file until it is recorded: exactly the ones
  // ingest has not finished.
  const { data } = useVideosList({
    organization: organizationId,
    proper_import: false,
    ordering: "-id",
    limit: 100,
  });
  const live = (data?.data.results ?? []).filter(isLiveProgramme);
  const upcoming = live.filter((video) => !isPastLiveProgramme(video));
  const past = live.filter(isPastLiveProgramme);
  if (!live.length) return null;

  return (
    <section aria-labelledby="live-programmes-heading" className="mt-4 space-y-3">
      <h2 id="live-programmes-heading" className="text-xl font-bold">
        Direktesendinger
      </h2>
      {upcoming.length ? (
        <ul>
          {upcoming.map((video) => (
            <Row key={video.id} note={`Sendes ${nextLiveAiring(video)}`} video={video} />
          ))}
        </ul>
      ) : (
        <p className="text-default-600">Ingen direktesendinger er satt opp.</p>
      )}
      {past.length ? (
        <details>
          <summary className="cursor-pointer py-2 font-semibold text-default-700">
            Tidligere, uten opptak ({past.length})
          </summary>
          <ul>
            {past.map((video) => (
              <Row
                key={video.id}
                note="Ble sendt direkte uten opptak, så det finnes ingen fil å vise i arkivet."
                video={video}
                menu={
                  <VideoRowMenu
                    video={video}
                    isDeleting={isRemoving(video.id)}
                    onDelete={() =>
                      remove(video.id, video.name, `Slett «${video.name}»? Dette kan ikke angres.`)
                    }
                  />
                }
              />
            ))}
          </ul>
        </details>
      ) : null}
      {error && (
        <p role="alert" className="text-danger-700 text-sm">
          Kunne ikke slette: {error}
        </p>
      )}
    </section>
  );
};
