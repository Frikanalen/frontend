import type {
  AirtimeGrant,
  GrantItem,
  GrantItemVideo,
  GrantItemWriteRequest,
} from "@/generated/frikanalenDjangoAPI.schemas";
import { durationMilliseconds } from "./duration";

/** An item in a list being edited: what a GrantItem is before the server numbers it. */
export type DraftItem = Pick<GrantItem, "video">;

export const windowMilliseconds = (grant: Pick<AirtimeGrant, "starttime" | "endtime">) =>
  new Date(grant.endtime).getTime() - new Date(grant.starttime).getTime();

/**
 * How long a list plays, back to back. A video with no usable length counts as
 * zero here; the server refuses to save it, and the editor flags it.
 */
export const listMilliseconds = (items: readonly DraftItem[]) =>
  items.reduce((total, item) => total + (durationMilliseconds(item.video.duration) ?? 0), 0);

export const itemName = (item: DraftItem) => item.video.name;

/**
 * The body PUT /grants/{id}/items takes: the whole list, in order, no
 * positions.
 */
export const itemsPayload = (items: readonly DraftItem[]): GrantItemWriteRequest[] =>
  items.map((item) => ({ video: item.video.id }));

/**
 * A grant's list as the editor holds it. While the grant fills itself, the
 * member edits only what they pinned; the rule's own picks follow and are
 * replaced on every run. A hand-made grant is one list, all of it theirs.
 */
export const splitItems = <T extends Pick<GrantItem, "pinned">>(
  grant: Pick<AirtimeGrant, "fillRule">,
  items: readonly T[],
) =>
  isAutomatic(grant)
    ? { chosen: items.filter((item) => item.pinned), filled: items.filter((item) => !item.pinned) }
    : { chosen: [...items], filled: [] as T[] };

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

/**
 * Whether the list is closed to members: locked or compiled, or past its
 * deadline before the night job has caught up. A lock-exempt grant never is.
 */
export const isLocked = (
  grant: Pick<AirtimeGrant, "state" | "lockExempt" | "locksAt">,
  now: number = Date.now(),
) =>
  !grant.lockExempt &&
  (grant.state === "locked" ||
    grant.state === "compiled" ||
    (grant.state === "open" && Date.parse(grant.locksAt) <= now));

/** What a member sees about the grant's deadline. */
export const deadlineText = (
  grant: Pick<AirtimeGrant, "state" | "lockExempt" | "starttime" | "endtime">,
  formattedLocksAt: string,
  now: number = Date.now(),
) => {
  if (grant.state === "cancelled") return "Sendetiden er trukket tilbake.";
  if (Date.parse(grant.endtime) <= now) return "Sendetiden er over.";
  if (Date.parse(grant.starttime) <= now) return "Sendes nå.";
  if (grant.lockExempt) return "Unntatt fra låsing: listen kan endres helt frem til sending.";
  if (grant.state === "open") return `Listen kan endres til ${formattedLocksAt}.`;
  return `Listen ble låst ${formattedLocksAt}.`;
};

/**
 * Why a grant the server says the user can't edit is read-only, so the
 * editor never just leaves the tools out. Mirrors the server's rule:
 * members until the deadline, staff until compiled, lock-exempt grants
 * until air, and only for someone who may act for the organization.
 */
export const readOnlyReason = (
  grant: Pick<AirtimeGrant, "state" | "lockExempt" | "starttime" | "endtime" | "locksAt">,
  now: number = Date.now(),
) => {
  if (grant.state === "cancelled")
    return "Sendetiden er trukket tilbake, så listen kan ikke endres.";
  if (Date.parse(grant.endtime) <= now)
    return "Denne sendetiden er over, så listen kan ikke endres lenger. Gå tilbake for å sette opp en sendetid som kommer.";
  if (Date.parse(grant.starttime) <= now)
    return "Denne sendetiden er på lufta nå, så listen kan ikke endres.";
  const stillOpen = grant.lockExempt || (grant.state === "open" && Date.parse(grant.locksAt) > now);
  if (stillOpen)
    return "Du har ikke tilgang til å sette opp program for denne organisasjonen. Det krever at du er medlem eller redaktør i en godkjent medlemsorganisasjon, og at identiteten din er bekreftet.";
  return LOCKED;
};

const LOCKED = "Fristen er passert og listen er låst.";

/** Whether the list is read-only only because its deadline passed, which a
 * late-change request can undo. */
export const lockedByDeadline = (
  grant: Pick<AirtimeGrant, "state" | "lockExempt" | "starttime" | "endtime" | "locksAt">,
  now: number = Date.now(),
) => readOnlyReason(grant, now) === LOCKED;

/** Whether two lists play the same videos in the same order. */
export const sameList = (a: readonly DraftItem[], b: readonly DraftItem[]) =>
  a.length === b.length && a.every((item, index) => item.video.id === b[index].video.id);

/** The source a listed video airs from live, while it has no file. */
export const liveSourceName = (video: GrantItemVideo) =>
  video.liveSource != null && video.pendingUpload ? video.liveSource.name : undefined;

/** What a listed video is still waiting for, or where it airs from. */
export const itemStatus = (video: GrantItemVideo) => {
  const source = liveSourceName(video);
  if (source) return `direkte fra ${source}`;
  return video.pendingUpload ? "venter på fil" : undefined;
};
