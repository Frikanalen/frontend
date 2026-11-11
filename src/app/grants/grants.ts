import type {
  AirtimeGrant,
  GrantItem,
  GrantItemWriteRequest,
} from "@/generated/frikanalenDjangoAPI.schemas";
import { durationMilliseconds } from "./duration";

/** An item in a list being edited: what a GrantItem is before the server numbers it. */
export type DraftItem = Pick<GrantItem, "video" | "liveTransmission">;

export const windowMilliseconds = (grant: Pick<AirtimeGrant, "starttime" | "endtime">) =>
  new Date(grant.endtime).getTime() - new Date(grant.starttime).getTime();

/**
 * How long a list plays, back to back. A video with no usable length counts as
 * zero here; the server refuses to save it, and the editor flags it.
 */
export const listMilliseconds = (items: readonly DraftItem[]) =>
  items.reduce((total, item) => total + (durationMilliseconds(item.video.duration) ?? 0), 0);

export const itemName = (item: DraftItem) => item.liveTransmission?.name ?? item.video.name;

/**
 * The body PUT /grants/{id}/items takes: the whole list, in order, no
 * positions. Live transmissions can't be listed through the API yet.
 */
export const itemsPayload = (items: readonly DraftItem[]): GrantItemWriteRequest[] =>
  items.map((item) => ({ video: item.video.id }));

/** A list entry with a key of its own, since the same video can be listed twice. */
export type KeyedItem = DraftItem & { key: string };

/**
 * Puts `incoming` before or after the entry `targetKey`, after taking out any
 * entries with the same keys first: one function serves both a reorder within
 * the list and a drop from the video library.
 */
export const placeItems = (
  items: readonly KeyedItem[],
  incoming: readonly KeyedItem[],
  targetKey: string | null,
  position: "before" | "after",
) => {
  const moving = new Set(incoming.map(({ key }) => key));
  const rest = items.filter(({ key }) => !moving.has(key));
  const target = targetKey === null ? -1 : rest.findIndex(({ key }) => key === targetKey);
  if (target === -1) return [...rest, ...incoming];
  const at = position === "before" ? target : target + 1;
  return [...rest.slice(0, at), ...incoming, ...rest.slice(at)];
};

export type TimelineRow<T extends DraftItem> = {
  item: T;
  start: Date;
  end: Date;
  /** Runs past the end of the window, so the list can't be saved as it is. */
  overruns: boolean;
};

/**
 * When each entry would play: back to back from the grant's start, as the
 * compiler lays them out, plus whatever is left over, which airs graphics.
 */
export const timeline = <T extends DraftItem>(
  items: readonly T[],
  grant: Pick<AirtimeGrant, "starttime" | "endtime">,
) => {
  const windowEnd = new Date(grant.endtime).getTime();
  let cursor = new Date(grant.starttime).getTime();
  const rows: TimelineRow<T>[] = items.map((item) => {
    const start = cursor;
    cursor += durationMilliseconds(item.video.duration) ?? 0;
    return { item, start: new Date(start), end: new Date(cursor), overruns: cursor > windowEnd };
  });
  const graphics =
    cursor < windowEnd ? { start: new Date(cursor), end: new Date(windowEnd) } : null;
  return { rows, graphics };
};

export const isAutomatic = (grant: Pick<AirtimeGrant, "fillRule">) => grant.fillRule !== null;

export const STATE_LABELS: Record<AirtimeGrant["state"], string> = {
  open: "Åpen",
  locked: "Låst",
  compiled: "Klar for sending",
  cancelled: "Avlyst",
};

/** What a member sees about the grant's deadline. */
export const deadlineText = (
  grant: Pick<AirtimeGrant, "state" | "lockExempt">,
  formattedLocksAt: string,
) => {
  if (grant.state === "cancelled") return "Sendetiden er trukket tilbake.";
  if (grant.lockExempt) return "Unntatt fra låsing: listen kan endres helt frem til sending.";
  if (grant.state === "open") return `Listen kan endres til ${formattedLocksAt}.`;
  return `Listen ble låst ${formattedLocksAt}.`;
};
