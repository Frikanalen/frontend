"use client";
import type { AirtimeGrant, GrantItemVideo } from "@/generated/frikanalenDjangoAPI.schemas";
import {
  getGrantsRetrieveQueryKey,
  useGrantsItemsUpdate,
  useGrantsRetrieve,
} from "@/generated/grants/grants";
import { useSeriesList } from "@/generated/series/series";
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
import { GoBroadcast, GoGrabber, GoPin, GoSync, GoX } from "react-icons/go";
import { durationMilliseconds, formatDuration } from "./duration";
import { HourBar } from "./HourBar";
import { ExemptionRequest } from "@/app/requests/ExemptionRequest";
import { mondayOf, osloPlace } from "@/app/schedule/plan/week/week";
import {
  deadlineText,
  fillSourceLabel,
  readOnlyReason,
  lockedByDeadline,
  isAutomatic,
  ownerChoosesSource,
  itemName,
  itemStatus,
  liveSourceName,
  itemsPayload,
  type KeyedItem,
  listMilliseconds,
  placeItems,
  sameList,
  splitItems,
  STATE_LABELS,
  timeline,
  windowMilliseconds,
} from "./grants";
import { LockBadge } from "./LockBadge";
import { ModeBadge } from "./ModeBadge";
import { VIDEO_DRAG_TYPE, VideoPicker } from "./VideoPicker";

/** The source choice that is no series: everything the organization uploads. */
const EVERYTHING = "";

/** The source the grant holds, as the choice in the editor. */
const sourceOf = ({ recipe }: Pick<AirtimeGrant, "recipe">) =>
  recipe?.kind === "series" && recipe.series != null ? String(recipe.series) : EVERYTHING;

/** The drag type an entry already in the list travels under, carrying its key. */
const ITEM_DRAG_TYPE = "application/x-frikanalen-grant-item";

let nextKey = 0;
const keyed = (video: GrantItemVideo): KeyedItem => ({
  key: `item-${nextKey++}`,
  video,
});
/** What the editor edits: the pinned items of a self-filling grant, or all of a hand-made one. */
const keyedItems = (grant: AirtimeGrant) =>
  splitItems(grant, grant.items).chosen.map((item) => keyed(item.video));

const droppedVideos = async (items: DropItem[]) =>
  Promise.all(
    items
      .filter(isTextDropItem)
      .filter((item) => item.types.has(VIDEO_DRAG_TYPE))
      .map(async (item) => keyed(JSON.parse(await item.getText(VIDEO_DRAG_TYPE)))),
  );

const osloDateTime = (instant: string) =>
  format(inOsloTime(instant), "EEEE d. MMMM 'kl.' HH:mm", { locale: nb });

export const GrantEditor = ({
  grantId,
  backHref,
  newLiveFrom,
}: {
  grantId: number;
  backHref: string;
  /** Opens with a new live broadcast from this source ready to fill in. */
  newLiveFrom?: number;
}) => {
  const query = useGrantsRetrieve(grantId);
  const grant = query.data?.data;

  if (query.isLoading) return <p>Laster sendetid…</p>;
  if (query.isError || !grant) return <p role="alert">{formatApiError(query.error)}</p>;
  return <Editor backHref={backHref} grant={grant} key={grant.id} newLiveFrom={newLiveFrom} />;
};

const Editor = ({
  grant,
  backHref,
  newLiveFrom,
}: {
  grant: AirtimeGrant;
  backHref: string;
  newLiveFrom?: number;
}) => {
  const [items, setItems] = useState<KeyedItem[]>(() => keyedItems(grant));
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);
  const queryClient = useQueryClient();
  const saveItems = useGrantsItemsUpdate();
  // Whether the grant's rule fills the time the chosen videos leave.
  const [fillRest, setFillRest] = useState(isAutomatic(grant));
  // What it fills from: one of the organization's series, or everything.
  const storedSource = sourceOf(grant);
  const choosesSource = ownerChoosesSource(grant);
  const [source, setSource] = useState(storedSource);
  const [wholeSlot, setWholeSlot] = useState(false);
  const series = useSeriesList({ organization: grant.organization.id, limit: 200 });
  const sourceChanged = fillRest && choosesSource && (source !== storedSource || wholeSlot);
  const stored = splitItems(grant, grant.items);
  // Until a member changes something, the list is what the server holds.
  // Against that, so moving something and moving it back, or adding and
  // removing a video, isn't a change worth saving.
  const dirty = !sameList(items, stored.chosen) || fillRest !== isAutomatic(grant) || sourceChanged;
  // The rule's own picks are only known for the list as saved.
  const filled = fillRest && !dirty ? stored.filled : [];
  const windowLength = windowMilliseconds(grant);
  const used = listMilliseconds(items);
  const { rows: allRows, graphics } = timeline(
    [...items, ...filled.map((item, index) => ({ key: `filled-${index}`, video: item.video }))],
    grant,
  );
  const rows = allRows.slice(0, items.length);
  const filledRows = allRows.slice(items.length);
  const [now] = useState(Date.now);
  // Locked for transmission: the list is settled, so it is shown as it will
  // air, without the tools for changing it. Staff may still change it until
  // it airs, but have to ask for the tools first.
  const locked = !grant.lockExempt && (grant.state !== "open" || Date.parse(grant.locksAt) <= now);
  const [unlocked, setUnlocked] = useState(false);
  const editable = grant.canEdit && (!locked || unlocked);
  const showsAutomatic = fillRest;

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
    setFillRest(isAutomatic(data));
    setSource(sourceOf(data));
    setWholeSlot(false);
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
        data: {
          items: itemsPayload(items),
          automatic: fillRest,
          ...(sourceChanged
            ? {
                recipe:
                  source === EVERYTHING
                    ? { kind: "uploads" as const }
                    : { kind: "series" as const, series: Number(source) },
                wholeSlot,
              }
            : {}),
        },
      });
      setSaved(true);
      await refresh(response.data);
    } catch (caught) {
      setError(formatApiError(caught));
    }
  };

  const toggleFillRest = (on: boolean) => {
    // Turning it off keeps what the rule had picked, as a list of one's own.
    if (!on) setItems([...items, ...filled.map((item) => keyed(item.video))]);
    setFillRest(on);
    setSaved(false);
    setError(undefined);
  };

  return (
    <div className="space-y-5">
      {/* Staff come from the week page, and go back to the week this grant is in. */}
      {backHref.endsWith("?uke=") ? (
        <Link
          className="text-sm font-semibold text-link hover:underline"
          href={`${backHref}${mondayOf(osloPlace(grant.starttime).date)}`}
        >
          ← Tilbake til uken
        </Link>
      ) : (
        <Link className="text-sm font-semibold text-link hover:underline" href={backHref}>
          ← All sendetid
        </Link>
      )}
      <header className="flex flex-wrap items-start gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight first-letter:uppercase sm:text-4xl">
            {format(inOsloTime(grant.starttime), "EEEE d. MMMM", { locale: nb })}{" "}
            {formatOsloTime(grant.starttime)}–{formatOsloTime(grant.endtime)}
          </h1>
          <p className="text-default-600">
            {grant.organization.name} · {STATE_LABELS[grant.state]}
          </p>
        </div>
        <div className="ms-auto flex flex-wrap items-center gap-1">
          <ModeBadge automatic={showsAutomatic} className="text-sm" empty={items.length === 0} />
          <LockBadge className="text-sm" grant={grant} now={now} />
        </div>
      </header>

      <p className="text-default-700">{deadlineText(grant, osloDateTime(grant.locksAt))}</p>

      {grant.canEdit ? null : (
        <p className="border-l-4 border-warning bg-background p-3 text-sm" role="note">
          {readOnlyReason(grant)}
        </p>
      )}
      {!grant.canEdit && lockedByDeadline(grant, now) ? <ExemptionRequest grant={grant} /> : null}
      {grant.canEdit && locked && !unlocked ? (
        <p
          className="flex flex-wrap items-center gap-x-4 gap-y-2 border-l-4 border-warning bg-background p-3 text-sm"
          role="note"
        >
          <span className="grow">
            Listen er låst og gjort klar for sending. Som ansatt kan du likevel endre den frem til
            den går på lufta.
          </span>
          <HeroButton size="sm" variant="tertiary" onPress={() => setUnlocked(true)}>
            Endre likevel
          </HeroButton>
        </p>
      ) : null}

      {showsAutomatic && editable ? (
        <p className="border-l-4 border-brand-plum bg-background p-3 text-sm">
          Sendetiden fyller seg selv hver natt, helt frem til et døgn før sending. Videoer dere
          legger inn selv, blir stående først, og resten fylles rundt dem.
        </p>
      ) : null}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(18rem,2fr)]">
        <section className="space-y-4 bg-background p-4 sm:p-6">
          <h2 className="text-xl font-bold">Sendeliste</h2>
          <HourBar
            automatic={showsAutomatic}
            end={grant.endtime}
            rows={allRows}
            start={grant.starttime}
            used={used + listMilliseconds(filled)}
          />
          {editable ? (
            <p className="text-sm text-default-600">
              Dra videoer hit fra videolisten, og dra i håndtaket for å endre rekkefølgen.
            </p>
          ) : null}
          <GridList
            aria-label="Sendeliste"
            className="min-h-24 border-t border-foreground data-[drop-target]:bg-accent/10 data-[drop-target]:outline-2 data-[drop-target]:outline-dashed data-[drop-target]:outline-accent"
            dragAndDropHooks={dragAndDropHooks}
            items={rows.map((row) => ({ ...row, id: row.item.key }))}
            renderEmptyState={() => (
              <p className="flex min-h-24 items-center justify-center border-b border-dashed border-default-300 p-4 text-center text-default-600">
                {editable
                  ? fillRest
                    ? "Dra en video hit for å sette den først. Resten fylles automatisk."
                    : "Dra en video hit."
                  : fillRest
                    ? "Ingenting er valgt for hånd."
                    : "Ingenting er satt opp. Sendetiden viser grafikk."}
              </p>
            )}
            selectionMode="none"
          >
            {(row) => (
              <GridListItem
                className={cx(
                  "flex items-center gap-2 border-b bg-background px-1 py-3 outline-none data-[dragging]:opacity-50 data-[focus-visible]:ring-2 data-[focus-visible]:ring-focus",
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
                <span className="hidden w-28 shrink-0 whitespace-nowrap font-bold sm:block">
                  {formatOsloTime(row.start)}–{formatOsloTime(row.end)}
                </span>
                <span className="min-w-0 grow">
                  <span className="block text-sm font-bold sm:hidden">
                    {formatOsloTime(row.start)}–{formatOsloTime(row.end)}
                  </span>
                  <span className="flex items-center gap-1 font-semibold">
                    {liveSourceName(row.item.video) ? (
                      <GoBroadcast
                        aria-label="Direktesending"
                        className="shrink-0 text-danger-600"
                      />
                    ) : null}
                    <span className="truncate">{itemName(row.item)}</span>
                  </span>
                  <span className="text-sm text-default-600">
                    {formatDuration(durationMilliseconds(row.item.video.duration) ?? 0)}
                    {itemStatus(row.item.video) ? ` · ${itemStatus(row.item.video)}` : ""}
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
          {filledRows.length > 0 ? (
            <ul aria-label="Fylt automatisk" className="border-l-4 border-brand-plum">
              {filledRows.map((row) => (
                <li
                  key={row.item.key}
                  className="flex items-center gap-2 border-b border-default-200 px-2 py-3"
                >
                  <GoSync aria-label="Fylt automatisk" className="shrink-0 text-default-600" />
                  <span className="hidden w-28 shrink-0 whitespace-nowrap font-bold sm:block">
                    {formatOsloTime(row.start)}–{formatOsloTime(row.end)}
                  </span>
                  <span className="min-w-0 grow">
                    <span className="block text-sm font-bold sm:hidden">
                      {formatOsloTime(row.start)}–{formatOsloTime(row.end)}
                    </span>
                    <span className="block truncate font-semibold">{itemName(row.item)}</span>
                    <span className="text-sm text-default-600">
                      {formatDuration(durationMilliseconds(row.item.video.duration) ?? 0)}
                      {itemStatus(row.item.video) ? ` · ${itemStatus(row.item.video)}` : ""}
                    </span>
                  </span>
                  {editable ? (
                    <HeroButton
                      size="sm"
                      variant="tertiary"
                      onPress={() => change([...items, keyed(row.item.video)])}
                    >
                      <GoPin aria-hidden /> Behold
                    </HeroButton>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
          {graphics ? (
            <div className="flex items-center gap-2 px-1 text-default-600">
              <span
                className={cx(
                  "shrink-0 whitespace-nowrap",
                  editable ? "sm:w-[9.25rem] sm:ps-9" : "sm:w-28",
                )}
              >
                {formatOsloTime(graphics.start)}–{formatOsloTime(graphics.end)}
              </span>
              <span>{fillRest && dirty ? "Fylles automatisk når du lagrer" : "Grafikk"}</span>
            </div>
          ) : null}

          {error ? (
            <p className="border-l-4 border-danger bg-danger-50 p-3 text-danger-700" role="alert">
              {error}
            </p>
          ) : null}
          {editable ? (
            <label className="flex items-start gap-2 border-t border-default-200 pt-3">
              <input
                checked={fillRest}
                className="mt-1 size-4"
                type="checkbox"
                onChange={(event) => toggleFillRest(event.target.checked)}
              />
              <span>
                <span className="font-semibold">Fyll resten av tiden automatisk</span>
                <span className="block text-sm text-default-600">
                  Uten dette sendes bare det som står i listen, og resten av tiden viser grafikk.
                </span>
              </span>
            </label>
          ) : null}
          {editable && fillRest && choosesSource ? (
            <div className="space-y-2 ps-6">
              <label className="flex flex-wrap items-center gap-2">
                Fylles fra
                <select
                  className="max-w-full rounded-lg border border-default-300 bg-background px-3 py-2"
                  value={source}
                  onChange={(event) => {
                    setSource(event.target.value);
                    setSaved(false);
                    setError(undefined);
                  }}
                >
                  <option value={EVERYTHING}>Alt vi laster opp</option>
                  {(series.data?.data.results ?? []).map((option) => (
                    <option key={option.id} value={option.id}>
                      Serien «{option.name}»
                    </option>
                  ))}
                </select>
              </label>
              {grant.originSlot !== null ? (
                <label className="flex items-start gap-2 text-sm">
                  <input
                    checked={wholeSlot}
                    className="mt-0.5 size-4"
                    type="checkbox"
                    onChange={(event) => {
                      setWholeSlot(event.target.checked);
                      setSaved(false);
                    }}
                  />
                  Bruk dette for alle sendinger i denne faste sendeflaten
                </label>
              ) : null}
            </div>
          ) : null}
          {fillRest && !(editable && choosesSource) ? (
            <p className="text-sm text-default-600">Fylles fra {fillSourceLabel(grant)}.</p>
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
                  setFillRest(isAutomatic(grant));
                  setSource(storedSource);
                  setWholeSlot(false);
                  setError(undefined);
                }}
              >
                Forkast endringer
              </HeroButton>
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
          <aside className="bg-background p-4 sm:p-6">
            <VideoPicker
              newLiveFrom={newLiveFrom}
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
