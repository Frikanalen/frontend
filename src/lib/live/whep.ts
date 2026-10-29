/**
 * A minimal WHEP (WebRTC-HTTP egress) client for MediaMTX.
 *
 * It sends one offer with every ICE candidate already in it rather than
 * trickling them over PATCH: a preview is not latency-critical at setup,
 * and one request keeps the bearer token's job to a single check.
 */

export type WhepFailure = "not-found" | "unauthorized" | "error";

export class WhepError extends Error {
  readonly reason: WhepFailure;

  constructor(reason: WhepFailure, message: string) {
    super(message);
    this.reason = reason;
  }
}

export type WhepSession = {
  pc: RTCPeerConnection;
  stream: MediaStream;
  close: () => void;
};

// Without a deadline a host with no reachable STUN keeps gathering for
// about 40 seconds; what has been gathered by then is enough to start.
const ICE_GATHERING_TIMEOUT_MS = 2000;

const iceGatheringComplete = (pc: RTCPeerConnection) =>
  new Promise<void>((resolve) => {
    if (pc.iceGatheringState === "complete") return resolve();
    const done = () => {
      clearTimeout(timer);
      pc.removeEventListener("icegatheringstatechange", onChange);
      resolve();
    };
    const onChange = () => pc.iceGatheringState === "complete" && done();
    const timer = setTimeout(done, ICE_GATHERING_TIMEOUT_MS);
    pc.addEventListener("icegatheringstatechange", onChange);
  });

// MediaMTX explains a refusal as {"error": "..."}; worth showing, since it
// names problems such as a path the server has no configuration for.
const serverError = async (response: Response) => {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === "object" && "error" in body && typeof body.error === "string")
      return body.error;
  } catch {}
  return null;
};

export const whepUrl = (path: string) => `/${path}/whep`;

export async function startWhep(
  url: string,
  token: string,
  createPeerConnection: () => RTCPeerConnection = () => new RTCPeerConnection(),
): Promise<WhepSession> {
  const pc = createPeerConnection();
  const stream = new MediaStream();
  pc.addEventListener("track", (event) => stream.addTrack(event.track));
  pc.addTransceiver("video", { direction: "recvonly" });
  pc.addTransceiver("audio", { direction: "recvonly" });

  let location: string | null = null;
  const close = () => {
    pc.close();
    // Tell MediaMTX straight away rather than leaving it to time the session
    // out; failure here changes nothing for the viewer.
    if (location)
      fetch(new URL(location, window.location.href), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
  };

  try {
    await pc.setLocalDescription(await pc.createOffer());
    await iceGatheringComplete(pc);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/sdp", Authorization: `Bearer ${token}` },
      body: pc.localDescription!.sdp,
    });
    if (response.status === 404) throw new WhepError("not-found", "No stream on this path");
    if (response.status === 401 || response.status === 403)
      throw new WhepError("unauthorized", "Not allowed to read this stream");
    if (response.status !== 201)
      throw new WhepError(
        "error",
        (await serverError(response)) ?? `Unexpected WHEP response ${response.status}`,
      );

    location = response.headers.get("Location");
    await pc.setRemoteDescription({ type: "answer", sdp: await response.text() });
  } catch (cause) {
    close();
    if (cause instanceof WhepError) throw cause;
    throw new WhepError("error", cause instanceof Error ? cause.message : String(cause));
  }

  return { pc, stream, close };
}
