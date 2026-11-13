import type { ConnectionExample } from "@/generated/frikanalenDjangoAPI.schemas";

/** What we ask members to send, shown beside every set of encoder settings. */
export const RECOMMENDED_ENCODING = "H.264, 1080p50, 6–12 Mbit/s. Lyd: AAC, 48 kHz stereo.";

/**
 * An RTMP address as the two fields most encoders ask for. The encoder
 * joins them with a slash itself, so the server must not end in one: a
 * doubled slash sends the signal to a path that doesn't exist.
 */
export const splitRtmp = (url: string): { server: string; streamKey: string } => {
  const [address, query = ""] = url.split(/\?(.*)/s);
  const at = address.lastIndexOf("/");
  return {
    server: address.slice(0, at),
    streamKey: address.slice(at + 1) + (query ? `?${query}` : ""),
  };
};

/**
 * An SRT address with its stream ID apart. Many encoders ignore a stream ID
 * written into the address and want it in a field of its own.
 */
export const splitSrt = (url: string): { address: string; streamId: string } => {
  const [address, query = ""] = url.split(/\?(.*)/s);
  // Not URLSearchParams: the stream ID is used as written, colons and all.
  const streamId = /(?:^|&)streamid=([^&]*)/.exec(query)?.[1] ?? "";
  return { address, streamId: decodeURIComponent(streamId) };
};

export const connectionFor = (connections: readonly ConnectionExample[], label: string) =>
  connections.find((connection) => connection.label === label);

/** The encoders the setup has ready-made instructions for. */
export const ENCODERS = [
  { id: "obs", name: "OBS Studio", hint: "Også vMix og andre med Server og Strømnøkkel" },
  { id: "blackmagic", name: "Blackmagic", hint: "ATEM Mini, Web Presenter" },
  { id: "other", name: "Annen koder", hint: "Alt som sender SRT eller RTMP" },
] as const;
export type EncoderId = (typeof ENCODERS)[number]["id"];

/** What Frikanalen can fetch a signal from, with an address to model yours on. */
export const PULL_PROTOCOLS = [
  {
    id: "srt",
    name: "SRT",
    example: "srt://kamera.example.no:9000?passphrase=hemmelig",
    hint: "Avsenderen venter på at vi kobler til (listener).",
  },
  {
    id: "rtmp",
    name: "RTMP / RTMPS",
    example: "rtmps://strøm.example.no/live/strømnøkkel",
    hint: "En strøm som alt er publisert på en RTMP-tjener.",
  },
  {
    id: "rtsp",
    name: "RTSP",
    example: "rtsp://bruker:passord@kamera.example.no:554/stream1",
    hint: "Vanlig for IP-kameraer.",
  },
  {
    id: "hls",
    name: "HLS",
    example: "https://strøm.example.no/live/index.m3u8",
    hint: "En nettstrøm som alt finnes; adressen ender på .m3u8.",
  },
] as const;
export type PullProtocolId = (typeof PULL_PROTOCOLS)[number]["id"];
