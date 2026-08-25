"use client";

import { FormError } from "@/components/form/FormError";
import { Video } from "@/generated/frikanalenDjangoAPI.schemas";
import { useVideosList, useVideosPartialUpdate } from "@/generated/videos/videos";
import { formatApiError } from "@/lib/formatApiError";
import { orderSeriesEpisodes } from "@/app/series/orderSeriesEpisodes";
import { Button, Spinner } from "@heroui/react";
import Link from "next/link";
import { useMemo, useState } from "react";

const EPISODE_LIMIT = 1000;

export const SeriesEpisodeOrder = ({ seriesId }: { seriesId: number }) => {
  const list = useVideosList({ series: seriesId, limit: EPISODE_LIMIT });
  const update = useVideosPartialUpdate();
  const [orderedIds, setOrderedIds] = useState<number[] | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const fetchedEpisodes = useMemo(
    () => orderSeriesEpisodes(list.data?.data.results ?? []),
    [list.data?.data.results],
  );
  const episodes = useMemo(() => {
    if (!orderedIds) return fetchedEpisodes;

    const byId = new Map(fetchedEpisodes.map((video) => [video.id, video]));
    const ordered = orderedIds.flatMap((id) => {
      const video = byId.get(id);
      return video ? [video] : [];
    });
    const included = new Set(orderedIds);
    return [...ordered, ...fetchedEpisodes.filter(({ id }) => !included.has(id))];
  }, [fetchedEpisodes, orderedIds]);

  const isTruncated = (list.data?.data.count ?? 0) > fetchedEpisodes.length;
  const hasChanges = episodes.some((video, index) => video.episodeNumber !== index + 1);

  const move = (index: number, offset: -1 | 1) => {
    const destination = index + offset;
    if (destination < 0 || destination >= episodes.length) return;

    const next = episodes.map(({ id }) => id);
    [next[index], next[destination]] = [next[destination], next[index]];
    setOrderedIds(next);
    setError(null);
    setSaved(false);
  };

  const save = async () => {
    setError(null);
    setSaved(false);
    setIsSaving(true);

    try {
      const changedEpisodes = episodes.flatMap((video, index) =>
        video.episodeNumber === index + 1 ? [] : [{ video, episodeNumber: index + 1 }],
      );
      // Episode numbers are unique within a series. Clear the affected slots
      // before assigning the final values so swaps cannot collide mid-save.
      await Promise.all(
        changedEpisodes.flatMap(({ video }) =>
          video.episodeNumber === null || video.episodeNumber === undefined
            ? []
            : [
                update.mutateAsync({
                  id: video.id.toString(),
                  data: { episodeNumber: null },
                }),
              ],
        ),
      );
      await Promise.all(
        changedEpisodes.map(({ video, episodeNumber }) =>
          update.mutateAsync({
            id: video.id.toString(),
            data: { episodeNumber },
          }),
        ),
      );
      await list.refetch();
      setOrderedIds(null);
      setSaved(true);
    } catch (cause) {
      setError(formatApiError(cause));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="space-y-4 rounded-large border border-default-200 p-4 sm:p-6">
      <div>
        <h2 className="text-xl font-bold">Episoderekkefølge</h2>
        <p className="text-sm text-foreground-500">
          Flytt episodene til ønsket rekkefølge. Ved lagring nummereres hele serien fortløpende fra
          1.
        </p>
      </div>

      <FormError error={error} />
      {saved && (
        <p role="status" className="text-sm text-success-700">
          Episoderekkefølgen er lagret.
        </p>
      )}

      {list.isPending ? (
        <div className="flex items-center gap-2 text-sm text-foreground-500">
          <Spinner size="sm" /> Henter episoder …
        </div>
      ) : list.isError ? (
        <p role="alert">Episodene kunne ikke hentes. Prøv igjen om litt.</p>
      ) : episodes.length === 0 ? (
        <p className="text-sm text-foreground-500">
          Serien har ingen ferdigbehandlede episoder ennå.
        </p>
      ) : (
        <ol className="divide-y divide-default-200 rounded-medium border border-default-200">
          {episodes.map((video, index) => (
            <EpisodeRow
              key={video.id}
              video={video}
              number={index + 1}
              isFirst={index === 0}
              isLast={index === episodes.length - 1}
              onMoveUp={() => move(index, -1)}
              onMoveDown={() => move(index, 1)}
            />
          ))}
        </ol>
      )}

      {isTruncated && (
        <p role="alert">
          Serien har flere enn {EPISODE_LIMIT} episoder. Alle episodene må kunne hentes før
          rekkefølgen kan lagres.
        </p>
      )}

      {episodes.length > 0 && (
        <div className="flex justify-end">
          <Button
            color="primary"
            isDisabled={!hasChanges || isTruncated}
            isLoading={isSaving}
            onPress={save}
          >
            Lagre rekkefølge
          </Button>
        </div>
      )}
    </section>
  );
};

const EpisodeRow = ({
  video,
  number,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
}: {
  video: Video;
  number: number;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) => (
  <li className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
    <span
      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-700"
      aria-label={`Episodenummer ${number}`}
    >
      {number}
    </span>
    <div className="min-w-0 flex-1">
      <Link href={`/video/${video.id}/edit`} className="font-medium hover:underline">
        {video.name}
      </Link>
      {video.episodeNumber !== number && (
        <p className="text-xs text-foreground-500">
          {video.episodeNumber ? `Tidligere episode ${video.episodeNumber}` : "Ikke nummerert"}
        </p>
      )}
    </div>
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="flat"
        isDisabled={isFirst}
        aria-label={`Flytt ${video.name} opp`}
        onPress={onMoveUp}
      >
        Opp
      </Button>
      <Button
        size="sm"
        variant="flat"
        isDisabled={isLast}
        aria-label={`Flytt ${video.name} ned`}
        onPress={onMoveDown}
      >
        Ned
      </Button>
    </div>
  </li>
);
