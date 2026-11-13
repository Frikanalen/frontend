import type { LiveSource, Signal } from "@/generated/frikanalenDjangoAPI.schemas";

/**
 * Where a live source stands, as one word a member can act on. A source
 * and its encoders are stored apart, but to the member they are one
 * thing: a place to send to that either can or cannot receive right now.
 */
export type SourceStatus =
  | "off"
  /** Pushed to, but no encoder holds a key: nothing can come in. */
  | "no-encoder"
  | "waiting"
  /** Pulled: fetched only while someone watches or a broadcast is near. */
  | "on-demand"
  | "receiving";

export const sourceStatus = (
  source: Pick<LiveSource, "enabled" | "isPulled" | "encoderCount">,
  /** Undefined where the receiver cannot be asked. */
  signal?: Pick<Signal, "receiving">,
): SourceStatus => {
  if (source.enabled === false) return "off";
  if (signal?.receiving) return "receiving";
  if (source.isPulled) return "on-demand";
  if (source.encoderCount === 0) return "no-encoder";
  return "waiting";
};

export const STATUS_NAMES: Record<SourceStatus, string> = {
  off: "Slått av",
  "no-encoder": "Mangler koder",
  waiting: "Venter på signal",
  "on-demand": "Hentes ved behov",
  receiving: "Mottar signal",
};

/**
 * What to ask before an encoder loses its key, saying what follows from
 * it: removing is always allowed (a leaked key must go at once), so the
 * question carries the warning.
 */
export const removeEncoderQuestion = ({
  label,
  last,
  receiving,
  booking,
}: {
  label: string;
  /** No other encoder holds a key to the source. */
  last: boolean;
  /** A signal is coming in on the source right now. */
  receiving: boolean;
  /** The source's coming or current broadcast, in words. */
  booking?: string;
}) =>
  [
    `Fjerne «${label}»? Koderen kan ikke lenger sende til denne kilden.`,
    last
      ? "Dette er den eneste koderen: kilden kan ikke ta imot signal før en ny er koblet til."
      : "",
    receiving ? "Kilden mottar signal nå. Kommer det fra denne koderen, blir det borte." : "",
    booking ? `Kilden skal på lufta: ${booking}.` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

/** What to ask before an encoder's key is replaced. */
export const replaceKeyQuestion = (label: string) =>
  `Lage ny nøkkel til «${label}»? Den gamle slutter å virke med en gang, og koderen må få de nye innstillingene før den kan sende igjen.`;
