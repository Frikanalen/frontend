"use client";

import { FormError } from "@/components/form/FormError";
import type { Video } from "@/generated/frikanalenDjangoAPI.schemas";
import { useVideosList, useVideosPartialUpdate } from "@/generated/videos/videos";
import { formatApiError } from "@/lib/formatApiError";
import { keepPreviousData, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import { useState } from "react";
import { GoCheck, GoPlay } from "react-icons/go";

const SEARCH_LIMIT = 50;

export const AddSeriesVideosModal = ({
  organizationId,
  seriesId,
  episodes,
  isDisabled = false,
  onAdded,
}: {
  organizationId: number;
  seriesId: number;
  episodes: Video[];
  isDisabled?: boolean;
  onAdded: (_count: number) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Map<number, Video>>(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const update = useVideosPartialUpdate();
  const queryClient = useQueryClient();
  const search = useVideosList(
    {
      organization: organizationId,
      q: query.trim() || undefined,
      ordering: "-created_time",
      limit: SEARCH_LIMIT,
    },
    {
      query: {
        enabled: isOpen,
        placeholderData: keepPreviousData,
      },
    },
  );

  const videos = search.data?.data.results ?? [];
  const close = () => {
    if (isSaving) return;
    setIsOpen(false);
    setQuery("");
    setSelected(new Map());
    setError(null);
  };

  const toggle = (video: Video) => {
    if (video.series) return;
    setSelected((current) => {
      const next = new Map(current);
      if (next.has(video.id)) next.delete(video.id);
      else next.set(video.id, video);
      return next;
    });
    setError(null);
  };

  const add = async () => {
    const additions = [...selected.values()];
    if (!additions.length) return;

    setError(null);
    setIsSaving(true);
    try {
      const changedEpisodes = episodes.flatMap((video, index) =>
        video.episodeNumber === index + 1 ? [] : [{ video, episodeNumber: index + 1 }],
      );

      // Vacate changed episode numbers before assigning the final consecutive
      // order. This keeps swaps and gaps clear of the API's uniqueness rule.
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
      await Promise.all([
        ...changedEpisodes.map(({ video, episodeNumber }) =>
          update.mutateAsync({ id: video.id.toString(), data: { episodeNumber } }),
        ),
        ...additions.map((video, index) =>
          update.mutateAsync({
            id: video.id.toString(),
            data: { seriesId, episodeNumber: episodes.length + index + 1 },
          }),
        ),
      ]);

      await queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      onAdded(additions.length);
      setSelected(new Map());
      setQuery("");
      setIsOpen(false);
    } catch (cause) {
      setError(formatApiError(cause));
      setSelected(new Map());
      await queryClient.invalidateQueries({ queryKey: ["/api/videos"] }).catch(() => undefined);
    } finally {
      setIsSaving(false);
    }
  };

  const selectionLabel =
    selected.size === 1 ? "Legg til 1 video" : `Legg til ${selected.size} videoer`;

  return (
    <>
      <Button
        color="primary"
        variant="flat"
        isDisabled={isDisabled}
        onPress={() => setIsOpen(true)}
      >
        Legg til i serien
      </Button>
      <Modal
        isOpen={isOpen}
        onOpenChange={(open) => (open ? setIsOpen(true) : close())}
        isDismissable={!isSaving}
        hideCloseButton={isSaving}
        scrollBehavior="inside"
        size="3xl"
      >
        <ModalContent>
          <ModalHeader>Legg videoer til serien</ModalHeader>
          <ModalBody className="gap-4">
            <p className="text-sm text-foreground-500">
              Søk blant organisasjonens videoer og velg én eller flere. Videoene legges sist i
              serien.
            </p>
            <Input
              label="Søk i organisasjonens videoer"
              type="search"
              value={query}
              onValueChange={setQuery}
              autoFocus
            />
            <FormError error={error} />
            <div aria-live="polite" className="text-sm text-foreground-500">
              {search.isFetching
                ? "Søker …"
                : search.isError
                  ? "Søket kunne ikke gjennomføres."
                  : `${search.data?.data.count ?? 0} videoer funnet`}
            </div>
            {!search.isFetching && search.isError ? (
              <p role="alert" className="text-sm text-danger-700">
                {formatApiError(search.error)}
              </p>
            ) : videos.length ? (
              <ul className="grid gap-3 sm:grid-cols-2">
                {videos.map((video) => (
                  <VideoOption
                    key={video.id}
                    video={video}
                    seriesId={seriesId}
                    isSelected={selected.has(video.id)}
                    onToggle={() => toggle(video)}
                  />
                ))}
              </ul>
            ) : !search.isFetching ? (
              <p>Ingen ferdigbehandlede videoer funnet.</p>
            ) : null}
            {(search.data?.data.count ?? 0) > videos.length && (
              <p className="text-sm text-foreground-500">
                Viser de første {videos.length} treffene. Bruk søkefeltet for å snevre inn listen.
              </p>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" isDisabled={isSaving} onPress={close}>
              Avbryt
            </Button>
            <Button
              color="primary"
              isDisabled={selected.size === 0}
              isLoading={isSaving}
              onPress={add}
            >
              {selectionLabel}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

const VideoOption = ({
  video,
  seriesId,
  isSelected,
  onToggle,
}: {
  video: Video;
  seriesId: number;
  isSelected: boolean;
  onToggle: () => void;
}) => {
  const unavailableReason = video.series
    ? video.series.id === seriesId
      ? "Videoen er allerede i denne serien."
      : `Videoen er allerede i serien «${video.series.name}».`
    : null;

  return (
    <li>
      <button
        type="button"
        disabled={Boolean(unavailableReason)}
        aria-pressed={unavailableReason ? undefined : isSelected}
        onClick={onToggle}
        className={`flex h-full w-full gap-3 rounded-xl border p-3 text-left outline-hidden transition-colors focus-visible:ring-2 focus-visible:ring-focus ${
          unavailableReason
            ? "cursor-not-allowed border-default-200 bg-default-100 text-foreground-500"
            : isSelected
              ? "border-primary bg-primary-50"
              : "border-default-200 hover:border-primary hover:bg-content2"
        }`}
      >
        <span className="relative block aspect-video w-28 shrink-0 overflow-hidden rounded-lg bg-content2">
          <GoPlay aria-hidden className="absolute inset-0 m-auto size-6 text-foreground-300" />
          {video.files.largeThumb?.url && (
            <Image
              removeWrapper
              disableSkeleton
              alt=""
              src={video.files.largeThumb.url}
              className="absolute inset-0 size-full object-cover"
            />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 font-medium">{video.name}</span>
          {video.duration && (
            <span className="mt-1 block text-xs text-foreground-500">{video.duration}</span>
          )}
          {unavailableReason && (
            <span className="mt-2 block text-xs font-medium text-foreground-600">
              {unavailableReason}
            </span>
          )}
        </span>
        {!unavailableReason && (
          <span
            aria-hidden
            className={`grid size-6 shrink-0 place-items-center rounded-full border ${
              isSelected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-default-400"
            }`}
          >
            {isSelected && <GoCheck className="size-4" />}
          </span>
        )}
      </button>
    </li>
  );
};
