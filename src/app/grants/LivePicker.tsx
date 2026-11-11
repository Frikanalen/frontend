"use client";
import { FormInput } from "@/components/FormField";
import type { LiveSource } from "@/generated/frikanalenDjangoAPI.schemas";
import { useOrganizationLiveSourcesList } from "@/generated/organization/organization";
import { formatApiError } from "@/lib/formatApiError";
import { Button as HeroButton } from "@heroui/react";
import { useState } from "react";
import { Button, GridList, GridListItem, useDragAndDrop } from "react-aria-components";
import { GoBroadcast, GoGrabber } from "react-icons/go";
import { formatDuration } from "./duration";
import type { DraftItem } from "./grants";
import { ENTRY_DRAG_TYPE } from "./grants";

const pad = (n: number) => String(n).padStart(2, "0");

/** Minutes as the API's "HH:MM:SS". */
const minutesDuration = (minutes: number) =>
  `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}:00`;

/**
 * The organization's live sources, to list a direct transmission. A live
 * entry has no video to take a length from, so the length (and, if wanted,
 * a title) is set here; it starts out as the time left in the window.
 */
export const LivePicker = ({
  organizationId,
  remaining,
  onPick,
}: {
  organizationId: number;
  remaining: number;
  onPick: (_entry: DraftItem) => void;
}) => {
  const sources = useOrganizationLiveSourcesList(organizationId);
  const enabled = (sources.data?.data ?? []).filter((source) => source.enabled);
  const left = Math.floor(Math.max(0, remaining) / 60000);
  const [minutes, setMinutes] = useState<string>();
  const [title, setTitle] = useState("");
  const length = Number(minutes ?? left);
  const valid = Number.isInteger(length) && length > 0;

  const toEntry = (source: LiveSource): DraftItem => ({
    video: null,
    liveTransmission: {
      source: { id: source.id, name: source.name },
      name: title.trim() || source.name,
      title: title.trim(),
      duration: minutesDuration(length),
    },
  });

  const { dragAndDropHooks } = useDragAndDrop<LiveSource>({
    getItems: (keys, items) =>
      items
        .filter((source) => keys.has(source.id))
        .map((source) => ({
          [ENTRY_DRAG_TYPE]: JSON.stringify(toEntry(source)),
          "text/plain": source.name,
        })),
    isDisabled: !valid,
  });

  return (
    <div className="space-y-3">
      <p className="text-sm text-default-600">
        En direktesending spiller av en av organisasjonens direktekilder. Sett lengden og gjerne en
        tittel, og legg den inn i listen.
      </p>
      <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-2">
        <FormInput
          description={`${formatDuration(Math.max(0, remaining))} igjen`}
          label="Lengde (min)"
          min={1}
          type="number"
          value={minutes ?? String(left)}
          onValueChange={setMinutes}
        />
        <FormInput label="Tittel (valgfri)" value={title} onValueChange={setTitle} />
      </div>
      {sources.isLoading ? <p>Laster direktekilder…</p> : null}
      {sources.isError ? <p role="alert">{formatApiError(sources.error)}</p> : null}
      <GridList
        aria-label="Direktekilder du kan legge til"
        className="space-y-1"
        // The rows render the length and title set above, so they re-render with them.
        dependencies={[title, length, valid]}
        dragAndDropHooks={dragAndDropHooks}
        items={enabled}
        renderEmptyState={() =>
          sources.isLoading ? null : (
            <p className="p-2">
              Organisasjonen har ingen direktekilder. De settes opp under Direktesending på
              organisasjonens side.
            </p>
          )
        }
        selectionMode="none"
      >
        {(source) => (
          <GridListItem
            className="flex cursor-grab items-center gap-2 rounded-lg border border-default-200 bg-background p-2 outline-none data-[dragging]:opacity-50 data-[focus-visible]:ring-2 data-[focus-visible]:ring-focus"
            id={source.id}
            textValue={source.name}
          >
            <Button
              aria-label={`Dra «${source.name}»`}
              className="cursor-grab rounded p-1 text-lg text-foreground/70 hover:bg-default-100"
              slot="drag"
            >
              <GoGrabber aria-hidden />
            </Button>
            <GoBroadcast aria-hidden className="shrink-0 text-danger-600" />
            <div className="min-w-0 grow">
              <div className="truncate font-medium">{title.trim() || source.name}</div>
              <div className="text-sm text-default-500">
                Direkte fra {source.name}
                {valid ? ` · ${formatDuration(length * 60000)}` : ""}
              </div>
            </div>
            <HeroButton
              isDisabled={!valid}
              size="sm"
              variant="tertiary"
              onPress={() => onPick(toEntry(source))}
            >
              Legg til
            </HeroButton>
          </GridListItem>
        )}
      </GridList>
    </div>
  );
};
