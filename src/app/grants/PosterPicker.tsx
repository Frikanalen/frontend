"use client";
import {
  SCREEN_TEMPLATES,
  ScreenTextEditor,
  screenTextState,
} from "@/components/screen-text/ScreenTextEditor";
import type {
  GrantItemPoster,
  GrantOrganization,
  Poster,
  TemplateEnum,
} from "@/generated/frikanalenDjangoAPI.schemas";
import {
  usePostersCreate,
  usePostersDestroy,
  usePostersList,
  usePostersPartialUpdate,
} from "@/generated/posters/posters";
import { formatApiError } from "@/lib/formatApiError";
import { Button as HeroButton, Modal } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import cx from "classnames";
import { useState } from "react";
import { Button, GridList, GridListItem, useDragAndDrop } from "react-aria-components";
import { GoGrabber, GoNote } from "react-icons/go";
import { durationMilliseconds, formatDuration } from "./duration";

/** The drag type a poster travels under, as JSON of a GrantItemPoster. */
export const POSTER_DRAG_TYPE = "application/x-frikanalen-poster";

/** What each on-air graphics template is called here. */
export const TEMPLATE_LABELS: Record<TemplateEnum, string> = SCREEN_TEMPLATES;

// Half light, half dark: the graphics pick by the time of day it airs.
const TEMPLATE_SWATCHES: Record<TemplateEnum, string> = {
  standard: "bg-[linear-gradient(90deg,#f5efe4_50%,#0f1926_50%)]",
  notice: "bg-[linear-gradient(90deg,#f5efe4_50%,#0f1926_50%)] border-l-4 border-[#faaa3f]",
};

/** Lengths to pick from, in seconds, above the time it takes to read it. */
const LENGTHS = [10, 15, 20, 30, 45, 60, 90, 120, 180, 300, 600];
const LONGEST = 600;

const seconds = (duration: string | undefined) =>
  Math.round((durationMilliseconds(duration ?? "") ?? 30_000) / 1000);

const pad = (n: number) => String(n).padStart(2, "0");
const apiDuration = (total: number) =>
  `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;

const toGrantPoster = (poster: Poster): GrantItemPoster => ({
  id: poster.id,
  template: poster.template ?? "standard",
  heading: poster.heading,
  text: poster.text ?? "",
  duration: poster.duration ?? "00:00:30",
});

type Draft = { template: TemplateEnum; heading: string; text: string; length: number };

const EMPTY: Draft = { template: "standard", heading: "", text: "", length: 30 };

/**
 * Makes or corrects a text poster in the editor shared with the channel's
 * bulletins (ScreenTextEditor), and adds how long the poster is listed for.
 */
const PosterEditor = ({
  organization,
  editing,
  isOpen,
  remaining,
  onClose,
  onSaved,
}: {
  organization: GrantOrganization;
  /** The poster being corrected; a new one when null. */
  editing: Poster | null;
  isOpen: boolean;
  remaining: number;
  onClose: () => void;
  onSaved: (_poster: Poster, _created: boolean) => void;
}) => {
  const queryClient = useQueryClient();
  const create = usePostersCreate();
  const update = usePostersPartialUpdate();
  const destroy = usePostersDestroy();
  // Mounted afresh each time it opens, so it starts from the poster being
  // corrected, or from nothing.
  const [draft, setDraft] = useState<Draft>(() =>
    editing
      ? {
          template: editing.template ?? "standard",
          heading: editing.heading,
          text: editing.text ?? "",
          length: seconds(editing.duration),
        }
      : EMPTY,
  );
  const { seconds: minimum, valid: readable } = screenTextState(draft);
  // The pick stands unless the text has grown past it.
  const length = Math.min(LONGEST, Math.max(draft.length, minimum));
  const lengths =
    minimum > LONGEST ? [LONGEST] : [minimum, ...LENGTHS.filter((choice) => choice > minimum)];
  const pending = create.isPending || update.isPending || destroy.isPending;
  const error = create.error ?? update.error ?? destroy.error;
  const valid = readable && minimum <= LONGEST;

  const set = (change: Partial<Draft>) => setDraft((current) => ({ ...current, ...change }));

  const close = () => {
    create.reset();
    update.reset();
    destroy.reset();
    onClose();
  };

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["/api/posters"] });

  const submit = async () => {
    if (!valid) return;
    const fields = {
      template: draft.template,
      heading: draft.heading.trim(),
      text: draft.text.trim(),
      duration: apiDuration(length),
    };
    const response = editing
      ? await update.mutateAsync({ id: editing.id, data: fields })
      : await create.mutateAsync({ data: { ...fields, organizationId: organization.id } });
    await refresh();
    onSaved(response.data, !editing);
    close();
  };

  const remove = async () => {
    if (!editing) return;
    await destroy.mutateAsync({ id: editing.id });
    await refresh();
    close();
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => (open ? undefined : close())}>
      <Modal.Backdrop isDismissable={!pending}>
        <Modal.Container scroll="outside" size="cover">
          <Modal.Dialog>
            <form
              aria-label={editing ? "Endre tekstplakat" : "Ny tekstplakat"}
              onSubmit={(event) => {
                event.preventDefault();
                void submit().catch(() => undefined);
              }}
            >
              <Modal.Header>
                <Modal.Heading>{editing ? "Endre tekstplakat" : "Ny tekstplakat"}</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="space-y-4">
                <p className="text-sm text-default-600">
                  En tekstplakat vises på skjermen så lenge du velger, for eksempel i pausen etter
                  et program. Navnet på organisasjonen kommer med av seg selv.
                </p>
                <ScreenTextEditor
                  autoFocus
                  from={organization.name}
                  kind="poster"
                  value={draft}
                  onChange={(text) => set(text)}
                >
                  <label className="flex flex-col gap-1 text-sm font-medium">
                    Hvor lenge den vises
                    <select
                      className="w-40 rounded-lg border border-default-300 bg-background px-3 py-2"
                      value={length}
                      onChange={(event) => set({ length: Number(event.target.value) })}
                    >
                      {lengths.map((choice) => (
                        <option key={choice} value={choice}>
                          {formatDuration(choice * 1000)}
                        </option>
                      ))}
                    </select>
                    <span className="font-normal text-default-600">
                      {minimum > LONGEST
                        ? "Teksten tar for lang tid å lese. Gjør den kortere."
                        : `Minst ${formatDuration(minimum * 1000)}, så alt rekker å bli lest én gang. Får den lenger tid, vises sidene på nytt.`}
                    </span>
                    {!editing && length * 1000 > remaining ? (
                      <span className="font-normal text-warning-700">
                        Det er bare {formatDuration(Math.max(0, remaining))} igjen i sendetiden.
                      </span>
                    ) : null}
                  </label>
                </ScreenTextEditor>
                {error ? <p role="alert">{formatApiError(error)}</p> : null}
              </Modal.Body>
              <Modal.Footer>
                {editing ? (
                  <HeroButton
                    className="me-auto"
                    isDisabled={pending}
                    variant="danger"
                    onPress={() => void remove().catch(() => undefined)}
                  >
                    Slett plakaten
                  </HeroButton>
                ) : null}
                <HeroButton variant="tertiary" onPress={close}>
                  Avbryt
                </HeroButton>
                <HeroButton isDisabled={!valid || pending} type="submit">
                  {editing ? "Lagre" : "Lag og legg til"}
                </HeroButton>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
};

/**
 * The organization's text posters, next to the videos. Drag one onto the list
 * to put it where it should air, or press "Legg til" to put it last. A poster
 * can be listed in any of the organization's airtime, as often as they like.
 */
export const PosterPicker = ({
  organization,
  remaining,
  onPick,
  onEdited,
}: {
  organization: GrantOrganization;
  /** Time left at the end of the list. */
  remaining: number;
  onPick: (_poster: GrantItemPoster) => void;
  /** A poster was corrected; the list should show the new text. */
  onEdited: (_poster: GrantItemPoster) => void;
}) => {
  const posters = usePostersList({ organization: organization.id, limit: 100 });
  const results = posters.data?.data.results ?? [];
  const [editing, setEditing] = useState<Poster | null>(null);
  const [open, setOpen] = useState(false);

  const { dragAndDropHooks } = useDragAndDrop<Poster>({
    getItems: (keys, items) =>
      items
        .filter((poster) => keys.has(poster.id))
        .map((poster) => ({
          [POSTER_DRAG_TYPE]: JSON.stringify(toGrantPoster(poster)),
          "text/plain": poster.heading,
        })),
  });

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="me-auto text-xl font-bold">Tekstplakater</h2>
        <HeroButton
          size="sm"
          variant="secondary"
          onPress={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <GoNote aria-hidden />
          Ny tekstplakat
        </HeroButton>
      </div>
      <PosterEditor
        editing={editing}
        isOpen={open}
        key={open ? (editing?.id ?? "new") : "closed"}
        organization={organization}
        remaining={remaining}
        onClose={() => setOpen(false)}
        onSaved={(poster, created) =>
          created ? onPick(toGrantPoster(poster)) : onEdited(toGrantPoster(poster))
        }
      />
      {posters.isError ? <p role="alert">{formatApiError(posters.error)}</p> : null}
      <GridList
        aria-label="Tekstplakater du kan legge til"
        className="max-h-[20rem] overflow-y-auto border-t border-default-200"
        dependencies={[remaining]}
        dragAndDropHooks={dragAndDropHooks}
        items={results}
        renderEmptyState={() =>
          posters.isLoading ? null : (
            <p className="p-2 text-sm text-default-600">
              Ingen plakater ennå. En plakat kan for eksempel fortelle hva som kommer etter pausen,
              eller hvordan seerne kan nå dere.
            </p>
          )
        }
        selectionMode="none"
      >
        {(poster) => {
          const length = durationMilliseconds(poster.duration ?? "") ?? 0;
          return (
            <GridListItem
              className="flex cursor-grab items-center gap-2 border-b border-default-200 bg-background px-1 py-2.5 outline-none data-[dragging]:opacity-50 data-[focus-visible]:ring-2 data-[focus-visible]:ring-focus"
              id={poster.id}
              textValue={poster.heading}
            >
              <Button
                aria-label={`Dra «${poster.heading}»`}
                className="cursor-grab rounded p-1 text-lg text-foreground/70 hover:bg-default-100"
                slot="drag"
              >
                <GoGrabber aria-hidden />
              </Button>
              <span
                aria-hidden
                className={cx(
                  "h-6 w-10 shrink-0 rounded-sm",
                  TEMPLATE_SWATCHES[poster.template ?? "standard"],
                )}
              />
              <div className="min-w-0 grow">
                <div className="truncate font-semibold">{poster.heading}</div>
                <div className="text-sm text-default-600">
                  {formatDuration(length)} · {TEMPLATE_LABELS[poster.template ?? "standard"]}
                  {length > remaining ? " · for lang for resten" : ""}
                </div>
              </div>
              <HeroButton
                size="sm"
                variant="tertiary"
                onPress={() => {
                  setEditing(poster);
                  setOpen(true);
                }}
              >
                Endre
              </HeroButton>
              <HeroButton
                size="sm"
                variant="tertiary"
                onPress={() => onPick(toGrantPoster(poster))}
              >
                Legg til
              </HeroButton>
            </GridListItem>
          );
        }}
      </GridList>
    </section>
  );
};
