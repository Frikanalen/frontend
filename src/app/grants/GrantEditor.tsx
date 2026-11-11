"use client";
import type { AirtimeGrant, GrantItemVideo } from "@/generated/frikanalenDjangoAPI.schemas";
import {
  getGrantsRetrieveQueryKey,
  useGrantsAutomaticCreate,
  useGrantsItemsUpdate,
  useGrantsRetrieve,
} from "@/generated/grants/grants";
import { formatApiError } from "@/lib/formatApiError";
import { formatOsloTime, inOsloTime } from "@/lib/osloTime";
import { Button as HeroButton } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import cx from "classnames";
import { format } from "date-fns";
import { nb } from "date-fns/locale/nb";
import Link from "next/link";
import { useState } from "react";
import {
  Button,
  DropIndicator,
  GridList,
  GridListItem,
  isTextDropItem,
  useDragAndDrop,
  type DropItem,
} from "react-aria-components";
import { GoGrabber, GoX } from "react-icons/go";
import { durationMilliseconds, formatDuration } from "./duration";
import { FillBar } from "./FillBar";
import {
  deadlineText,
  readOnlyReason,
  isAutomatic,
  itemName,
  itemsPayload,
  type KeyedItem,
  listMilliseconds,
  placeItems,
  sameList,
  STATE_LABELS,
  timeline,
  windowMilliseconds,
} from "./grants";
import { ModeBadge, modeSurface } from "./ModeBadge";
import { VIDEO_DRAG_TYPE, VideoPicker } from "./VideoPicker";

/** The drag type an entry already in the list travels under, carrying its key. */
const ITEM_DRAG_TYPE = "application/x-frikanalen-grant-item";

let nextKey = 0;
const keyed = (video: GrantItemVideo): KeyedItem => ({
  key: `item-${nextKey++}`,
  video,
  liveTransmission: null,
});
const keyedItems = (grant: AirtimeGrant) => grant.items.map((item) => keyed(item.video));

const droppedVideos = async (items: DropItem[]) =>
  Promise.all(
    items
      .filter(isTextDropItem)
      .filter((item) => item.types.has(VIDEO_DRAG_TYPE))
      .map(async (item) => keyed(JSON.parse(await item.getText(VIDEO_DRAG_TYPE)))),
  );

const osloDateTime = (instant: string) =>
  format(inOsloTime(instant), "EEEE d. MMMM 'kl.' HH:mm", { locale: nb });

export const GrantEditor = ({ grantId, backHref }: { grantId: number; backHref: string }) => {
  const query = useGrantsRetrieve(grantId);
  const grant = query.data?.data;

  if (query.isLoading) return <p>Laster sendetid…</p>;
  if (query.isError || !grant) return <p role="alert">{formatApiError(query.error)}</p>;
  return <Editor backHref={backHref} grant={grant} key={grant.id} />;
};

const Editor = ({ grant, backHref }: { grant: AirtimeGrant; backHref: string }) => {
  const [items, setItems] = useState<KeyedItem[]>(() => keyedItems(grant));
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);
  const queryClient = useQueryClient();
  const saveItems = useGrantsItemsUpdate();
  const automatic = useGrantsAutomaticCreate();
  const windowLength = windowMilliseconds(grant);
  const used = listMilliseconds(items);
  const { rows, graphics } = timeline(items, grant);
  const editable = grant.canEdit;
  // Until a member changes it, an automatic list is still automatic.
  // Against what the server holds, so moving something and moving it back,
  // or adding and removing a video, isn't a change worth saving.
  const dirty = !sameList(items, grant.items);
  const showsAutomatic = isAutomatic(grant) && !dirty;

  const change = (next: KeyedItem[]) => {
    setItems(next);
    setSaved(false);
    setError(undefined);
  };

  const { dragAndDropHooks } = useDragAndDrop<KeyedItem>({
    isDisabled: !editable,
    // A drag starts from the list itself (a reorder) or from the library (an
    // insert); anything else dragged over the list is refused.
    acceptedDragTypes: [ITEM_DRAG_TYPE, VIDEO_DRAG_TYPE],
    getItems: (keys) =>
      items
        .filter(({ key }) => keys.has(key))
        .map((item) => ({ [ITEM_DRAG_TYPE]: item.key, "text/plain": itemName(item) })),
    onReorder: ({ keys, target }) => {
      const moving = items.filter(({ key }) => keys.has(key));
      change(
        placeItems(
          items,
          moving,
          String(target.key),
          target.dropPosition === "before" ? "before" : "after",
        ),
      );
    },
    onInsert: async ({ items: dropped, target }) => {
      change(
        placeItems(
          items,
          await droppedVideos(dropped),
          String(target.key),
          target.dropPosition === "before" ? "before" : "after",
        ),
      );
    },
    onRootDrop: async ({ items: dropped }) => {
      change([...items, ...(await droppedVideos(dropped))]);
    },
    renderDropIndicator: (target) => (
      <DropIndicator
        className="my-0.5 h-1 rounded-full data-[drop-target]:bg-accent"
        target={target}
      />
    ),
  });

  // Starts the editor afresh from what the server now holds.
  const refresh = async (data: AirtimeGrant) => {
    setItems(keyedItems(data));
    queryClient.setQueryData(getGrantsRetrieveQueryKey(grant.id), (old: object | undefined) => ({
      ...(old ?? {}),
      data,
    }));
    await queryClient.invalidateQueries({ queryKey: ["/api/grants"] });
  };

  const save = async () => {
    setError(undefined);
    try {
      const response = await saveItems.mutateAsync({
        id: grant.id,
        data: { items: itemsPayload(items) },
      });
      setSaved(true);
      await refresh(response.data);
    } catch (caught) {
      setError(formatApiError(caught));
    }
  };

  const backToAutomatic = async () => {
    if (!globalThis.confirm("Erstatte listen med et automatisk utvalg?")) return;
    setError(undefined);
    try {
      const response = await automatic.mutateAsync({ id: grant.id });
      await refresh(response.data);
    } catch (caught) {
      setError(formatApiError(caught));
    }
  };

  return (
    <div className="space-y-4">
      <Link className="text-primary-700 underline" href={backHref}>
        ← All sendetid
      </Link>
      <header className="flex flex-wrap items-start gap-3">
        <div>
          <h1 className="text-3xl font-bold first-letter:uppercase">
            {format(inOsloTime(grant.starttime), "EEEE d. MMMM", { locale: nb })}{" "}
            {formatOsloTime(grant.starttime)}–{formatOsloTime(grant.endtime)}
          </h1>
          <p className="text-default-600">
            {grant.organization.name} · {STATE_LABELS[grant.state]}
          </p>
        </div>
        <ModeBadge
          automatic={showsAutomatic}
          className="ms-auto text-sm"
          empty={items.length === 0}
        />
      </header>

      <p className="text-default-700">{deadlineText(grant, osloDateTime(grant.locksAt))}</p>

      {editable ? null : (
        <p
          className="rounded-lg border border-warning-300 bg-warning-50 p-3 text-sm dark:bg-warning-950"
          role="note"
        >
          {readOnlyReason(grant)}
        </p>
      )}

      {showsAutomatic && editable ? (
        <p className="rounded-lg border border-dashed border-secondary-300 bg-secondary-50 p-3 text-sm dark:bg-secondary-950">
          Listen fylles automatisk hver natt frem til fristen. Endrer du den, blir den manuell og
          blir stående slik du lagrer den.
        </p>
      ) : null}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(18rem,2fr)]">
        <section className={cx("space-y-3 rounded-xl p-4", modeSurface(showsAutomatic))}>
          <h2 className="text-lg font-semibold">Sendeliste</h2>
          <FillBar automatic={showsAutomatic} used={used} window={windowLength} />
          {editable ? (
            <p className="text-sm text-default-600">
              Dra videoer hit fra videolisten, og dra i håndtaket for å endre rekkefølgen.
            </p>
          ) : null}
          <GridList
            aria-label="Sendeliste"
            className="min-h-24 space-y-1 rounded-lg p-1 data-[drop-target]:bg-accent/10 data-[drop-target]:outline-2 data-[drop-target]:outline-dashed data-[drop-target]:outline-accent"
            dragAndDropHooks={dragAndDropHooks}
            items={rows.map((row) => ({ ...row, id: row.item.key }))}
            renderEmptyState={() => (
              <p className="flex min-h-24 items-center justify-center rounded-lg border-2 border-dashed border-default-300 p-4 text-center text-default-500">
                {editable
                  ? "Dra en video hit."
                  : "Ingenting er satt opp. Sendetiden viser grafikk."}
              </p>
            )}
            selectionMode="none"
          >
            {(row) => (
              <GridListItem
                className={cx(
                  "flex items-center gap-2 rounded-lg border bg-background p-2 outline-none data-[dragging]:opacity-50 data-[focus-visible]:ring-2 data-[focus-visible]:ring-focus",
                  row.overruns
                    ? "border-danger-400 bg-danger-50 dark:bg-danger-950"
                    : "border-default-200",
                )}
                id={row.id}
                textValue={itemName(row.item)}
              >
                {editable ? (
                  <Button
                    aria-label={`Flytt «${itemName(row.item)}»`}
                    className="cursor-grab rounded p-1 text-lg text-foreground/70 hover:bg-default-100"
                    slot="drag"
                  >
                    <GoGrabber aria-hidden />
                  </Button>
                ) : null}
                {/* On a phone the time goes above the title, so the title keeps the width. */}
                <span className="hidden w-28 shrink-0 whitespace-nowrap text-sm tabular-nums sm:block">
                  {formatOsloTime(row.start)}–{formatOsloTime(row.end)}
                </span>
                <span className="min-w-0 grow">
                  <span className="block text-sm tabular-nums sm:hidden">
                    {formatOsloTime(row.start)}–{formatOsloTime(row.end)}
                  </span>
                  <span className="block truncate font-medium">{itemName(row.item)}</span>
                  <span className="text-sm text-default-500">
                    {formatDuration(durationMilliseconds(row.item.video.duration) ?? 0)}
                    {row.item.video.pendingUpload ? " · venter på fil" : ""}
                    {row.item.video.organization.id !== grant.organization.id
                      ? ` · ${row.item.video.organization.name}`
                      : ""}
                    {row.overruns ? (
                      <span className="font-medium text-danger-700"> · går over sendetiden</span>
                    ) : null}
                  </span>
                </span>
                {editable ? (
                  <HeroButton
                    aria-label={`Fjern «${itemName(row.item)}»`}
                    isIconOnly
                    size="sm"
                    variant="tertiary"
                    onPress={() => change(items.filter(({ key }) => key !== row.item.key))}
                  >
                    <GoX aria-hidden />
                  </HeroButton>
                ) : null}
              </GridListItem>
            )}
          </GridList>
          {graphics ? (
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-default-300 bg-[repeating-linear-gradient(45deg,transparent_0_8px,rgb(127_127_127/0.08)_8px_16px)] p-2 text-default-500">
              <span
                className={cx(
                  "shrink-0 whitespace-nowrap text-sm tabular-nums",
                  editable ? "sm:w-[9.25rem] sm:ps-9" : "sm:w-28",
                )}
              >
                {formatOsloTime(graphics.start)}–{formatOsloTime(graphics.end)}
              </span>
              <span>Grafikk</span>
            </div>
          ) : null}

          {error ? (
            <p className="rounded-lg bg-danger-50 p-3 text-danger-700" role="alert">
              {error}
            </p>
          ) : null}
          {editable ? (
            <div className="flex flex-wrap items-center gap-2 border-t border-default-200 pt-3">
              <HeroButton
                isDisabled={!dirty || used > windowLength}
                isPending={saveItems.isPending}
                variant="primary"
                onPress={save}
              >
                Lagre listen
              </HeroButton>
              <HeroButton
                isDisabled={!dirty}
                variant="tertiary"
                onPress={() => {
                  setItems(keyedItems(grant));
                  setError(undefined);
                }}
              >
                Forkast endringer
              </HeroButton>
              {!isAutomatic(grant) && grant.originSlot !== null ? (
                <HeroButton
                  className="ms-auto"
                  isPending={automatic.isPending}
                  variant="tertiary"
                  onPress={backToAutomatic}
                >
                  Fyll automatisk igjen
                </HeroButton>
              ) : null}
              {saved ? (
                <span className="text-sm text-success-700" role="status">
                  Listen er lagret.
                </span>
              ) : dirty ? (
                <span className="text-sm text-default-600">Ikke lagret</span>
              ) : null}
            </div>
          ) : null}
        </section>

        {editable ? (
          <aside className="rounded-xl border border-default-200 bg-content1 p-4">
            <VideoPicker
              organizationId={grant.organization.id}
              remaining={windowLength - used}
              onPick={(video) => change([...items, keyed(video)])}
            />
          </aside>
        ) : null}
      </div>
    </div>
  );
};
