import type { Signal } from "@/generated/frikanalenDjangoAPI.schemas";
import { formatBitrate } from "./streamStats";

/**
 * What a member wants to know about the signal their encoder sends, from
 * what the receiver reports: is it what we ask for, and is it getting here
 * whole. Each line says so in words and flags what is worth acting on.
 */
export type SignalLine = {
  label: string;
  value: string;
  /** "warn" is worth a look; "bad" will not air properly. */
  status: "ok" | "warn" | "bad";
  /** What to do about it, when the status is not ok. */
  note?: string;
};

const number = (value: number, digits = 0) =>
  value.toLocaleString("nb-NO", { maximumFractionDigits: digits });

const VIDEO_NAMES: Record<string, string> = { H264: "H.264", H265: "HEVC" };
const AUDIO_NAMES: Record<string, string> = { "MPEG-4 Audio": "AAC", "MPEG-1/2 Audio": "MP3" };

export const formatElapsed = (milliseconds: number) => {
  const minutes = Math.floor(milliseconds / 60_000);
  if (minutes < 1) return "under 1 min";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} t ${minutes % 60} min`;
  return `${Math.floor(hours / 24)} d ${hours % 24} t`;
};

/**
 * Bits per second: between two reports when there are two of the same
 * connection, otherwise the average since the signal came in.
 */
export const signalBitrate = (signal: Signal, previous?: Signal): number | null => {
  const bytes = signal.bytesReceived ?? 0;
  const now = Date.parse(signal.measuredAt);
  if (previous?.receiving && previous.since === signal.since) {
    const elapsed = now - Date.parse(previous.measuredAt);
    const delta = bytes - (previous.bytesReceived ?? 0);
    if (elapsed > 0 && delta >= 0) return (delta * 8000) / elapsed;
  }
  const elapsed = signal.since ? now - Date.parse(signal.since) : 0;
  return elapsed >= 2000 ? (bytes * 8000) / elapsed : null;
};

const reception = (signal: Signal, pulled: boolean): SignalLine => {
  const how = pulled ? "Hentet av Frikanalen" : signal.protocol || "Mottatt";
  const elapsed = signal.since
    ? formatElapsed(Date.parse(signal.measuredAt) - Date.parse(signal.since))
    : null;
  return {
    label: "Mottak",
    value: elapsed ? `${how} · inne i ${elapsed}` : how,
    status: "ok",
  };
};

const picture = ({ video }: Signal): SignalLine => {
  if (!video)
    return {
      label: "Bilde",
      value: "Ikke noe bilde",
      status: "bad",
      note: "Signalet har ingen video vi kjenner igjen.",
    };
  const size = video.width && video.height ? `${video.width}×${video.height}` : null;
  const codec = [VIDEO_NAMES[video.codec] ?? video.codec, video.profile].filter(Boolean).join(" ");
  const value = [size, codec].filter(Boolean).join(" · ");
  if (video.codec !== "H264")
    return {
      label: "Bilde",
      value,
      status: "bad",
      note: "Vi sender bare H.264. Bytt videokodek i koderen.",
    };
  if (video.height && video.height < 1080)
    return {
      label: "Bilde",
      value,
      status: "warn",
      note: "Lavere oppløsning enn anbefalt (1920×1080).",
    };
  return { label: "Bilde", value, status: "ok" };
};

const sound = ({ audio }: Signal): SignalLine => {
  if (!audio)
    return {
      label: "Lyd",
      value: "Ingen lyd",
      status: "bad",
      note: "Signalet har ikke noe lydspor. Sjekk lydkilden i koderen.",
    };
  const channels =
    audio.channelCount === 2
      ? "stereo"
      : audio.channelCount === 1
        ? "mono"
        : audio.channelCount
          ? `${audio.channelCount} kanaler`
          : null;
  const rate = audio.sampleRate ? `${number(audio.sampleRate / 1000, 1)} kHz` : null;
  const value = [AUDIO_NAMES[audio.codec] ?? audio.codec, rate, channels]
    .filter(Boolean)
    .join(" · ");
  if (audio.channelCount === 1)
    return { label: "Lyd", value, status: "warn", note: "Vi anbefaler stereo." };
  if (audio.sampleRate && audio.sampleRate !== 48000)
    return { label: "Lyd", value, status: "warn", note: "Vi anbefaler 48 kHz." };
  return { label: "Lyd", value, status: "ok" };
};

// We ask for 6-12 Mbit/s; the margins keep a variable-rate encoder from
// flickering in and out of a warning.
const LOW_BITRATE = 4_000_000;
const HIGH_BITRATE = 15_000_000;

const rate = (signal: Signal, previous?: Signal): SignalLine => {
  const bitrate = signalBitrate(signal, previous);
  const value = formatBitrate(bitrate);
  if (bitrate !== null && bitrate < LOW_BITRATE)
    return {
      label: "Bitrate",
      value,
      status: "warn",
      note: "Lavere enn anbefalt (6–12 Mbit/s). Bildet kan bli grøtete.",
    };
  if (bitrate !== null && bitrate > HIGH_BITRATE)
    return {
      label: "Bitrate",
      value,
      status: "warn",
      note: "Høyere enn anbefalt (6–12 Mbit/s). Det gir ikke bedre bilde på lufta.",
    };
  return { label: "Bitrate", value, status: "ok" };
};

const transport = ({ srt, framesInError = 0 }: Signal): SignalLine[] => {
  const lines: SignalLine[] = [];
  if (srt) {
    const total = srt.packetsReceived + srt.packetsLost;
    const share = total > 0 ? (srt.packetsLost / total) * 100 : 0;
    const value =
      srt.packetsLost === 0
        ? "Ingen"
        : `${share < 0.01 ? "under 0,01" : number(share, 2)} % (${number(srt.packetsLost)} pakker)`;
    lines.push(
      srt.packetsDropped > 0
        ? {
            label: "Pakketap",
            value,
            status: "bad",
            note: `${number(srt.packetsDropped)} pakker kom aldri fram. Det synes som hakk i bildet. Sjekk nettet, eller øk latency i koderen.`,
          }
        : share > 1
          ? {
              label: "Pakketap",
              value,
              status: "warn",
              note: "Alt er hentet inn igjen så langt, men nettet er ustabilt.",
            }
          : { label: "Pakketap", value, status: "ok" },
    );
    if (srt.roundTripMs != null)
      lines.push({
        label: "Rundetid til oss",
        value: `${number(srt.roundTripMs)} ms`,
        status: "ok",
      });
  }
  if (framesInError > 0)
    lines.push({
      label: "Feil i signalet",
      value: `${number(framesInError)} bilder`,
      status: "warn",
      note: "Deler av signalet kom fram ødelagt.",
    });
  return lines;
};

/** The lines for a signal that is arriving; `previous` is the report before. */
export const describeSignal = (
  signal: Signal,
  pulled: boolean,
  previous?: Signal,
): SignalLine[] => [
  reception(signal, pulled),
  picture(signal),
  sound(signal),
  rate(signal, previous),
  ...transport(signal),
];

/**
 * Whether a source is ready to go on air, from everything that can be
 * checked without a person: the signal's lines, whether sound is actually
 * heard, and whether a broadcast is booked.
 */
export type Readiness = {
  level: "waiting" | "ready" | "check" | "problem";
  /** What stands in the way, most serious first; empty when ready. */
  reasons: string[];
};

export const readiness = ({
  signal,
  previous,
  pulled,
  silent,
}: {
  /** Undefined where the receiver cannot be asked. */
  signal: Signal | undefined;
  previous?: Signal;
  pulled: boolean;
  /** The preview has sound to listen to and has heard none for a while. */
  silent: boolean;
}): Readiness => {
  if (!signal?.receiving) return { level: "waiting", reasons: [] };
  const lines = describeSignal(signal, pulled, previous);
  const bad = lines.filter(({ status }) => status === "bad");
  const warn = lines.filter(({ status }) => status === "warn");
  const reasons = [...bad, ...warn].map(({ label, note, value }) => `${label}: ${note ?? value}`);
  if (silent && signal.audio)
    reasons.splice(bad.length, 0, "Lyd: Lydsporet er stille. Sjekk mikrofoner og lydmiks.");
  if (bad.length > 0) return { level: "problem", reasons };
  if (reasons.length > 0) return { level: "check", reasons };
  return { level: "ready", reasons };
};
