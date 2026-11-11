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

export const moveItem = <T>(items: readonly T[], from: number, to: number) => {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
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
