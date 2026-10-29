import { afterEach, describe, expect, it, vi } from "vitest";
import { startWhep, WhepError, whepUrl } from "./whep";

class FakePeerConnection {
  iceGatheringState = "complete";
  localDescription: { sdp: string } | null = null;
  remoteDescription: unknown = null;
  closed = false;
  addEventListener() {}
  removeEventListener() {}
  addTransceiver() {}
  async createOffer() {
    return { type: "offer", sdp: "offer-sdp" };
  }
  async setLocalDescription(description: { sdp: string }) {
    this.localDescription = description;
  }
  async setRemoteDescription(description: unknown) {
    this.remoteDescription = description;
  }
  close() {
    this.closed = true;
  }
}

const fakePc = () => {
  const pc = new FakePeerConnection();
  return { pc, factory: () => pc as unknown as RTCPeerConnection };
};

afterEach(() => vi.unstubAllGlobals());

describe("startWhep", () => {
  it("posts the offer with the bearer token and applies the answer", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("answer-sdp", {
        status: 201,
        headers: { Location: "/contrib/preview/x/whep/session" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { pc, factory } = fakePc();

    const session = await startWhep(whepUrl("contrib/preview/x"), "tok", factory);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/contrib/preview/x/whep");
    expect(init).toMatchObject({
      method: "POST",
      body: "offer-sdp",
      headers: { "Content-Type": "application/sdp", Authorization: "Bearer tok" },
    });
    expect(pc.remoteDescription).toEqual({ type: "answer", sdp: "answer-sdp" });

    session.close();
    expect(pc.closed).toBe(true);
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: "DELETE" });
  });

  it.each([
    [404, "not-found"],
    [401, "unauthorized"],
    [500, "error"],
  ])("turns HTTP %i into a %s failure and closes the connection", async (status, reason) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status })));
    const { pc, factory } = fakePc();

    const attempt = startWhep("/x/whep", "tok", factory);

    await expect(attempt).rejects.toBeInstanceOf(WhepError);
    await expect(attempt).rejects.toMatchObject({ reason });
    expect(pc.closed).toBe(true);
  });

  it("reports MediaMTX's own explanation of a refusal", async () => {
    const body = JSON.stringify({ error: "path 'contrib/preview/x' is not configured" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body, { status: 400 })));

    await expect(startWhep("/x/whep", "tok", fakePc().factory)).rejects.toMatchObject({
      reason: "error",
      message: "path 'contrib/preview/x' is not configured",
    });
  });
});
