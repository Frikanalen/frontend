import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProgramImage } from "@/generated/frikanalenDjangoAPI.schemas";
import { GIVE_UP_AFTER_MS, POLL_INTERVAL_MS, useNewProgramImage } from "./useNewProgramImage";

const api = vi.hoisted(() => ({ ids: [] as number[], list: vi.fn() }));

vi.mock("@/generated/videos/videos", () => ({
  videosImagesList: (...args: unknown[]) => {
    api.list(...args);
    return Promise.resolve({ data: { results: api.ids.map((id) => ({ id })) } });
  },
}));

const known = [{ id: 1 } as ProgramImage];
const file = new File(["x"], "bilde.png", { type: "image/png" });

const tick = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

describe("useNewProgramImage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    api.ids = [1];
    api.list.mockClear();
  });
  afterEach(() => vi.useRealTimers());

  it("is idle and does not poll before an upload has finished", async () => {
    const { result } = renderHook(() => useNewProgramImage(7, null, known, vi.fn()));
    await tick(POLL_INTERVAL_MS * 3);
    expect(result.current).toBe("idle");
    expect(api.list).not.toHaveBeenCalled();
  });

  it("is processing until an image the page did not have shows up", async () => {
    const onReady = vi.fn();
    const { result } = renderHook(() => useNewProgramImage(7, file, known, onReady));
    expect(result.current).toBe("processing");

    await tick(POLL_INTERVAL_MS);
    expect(result.current).toBe("processing");

    api.ids = [1, 2];
    await tick(POLL_INTERVAL_MS);
    expect(result.current).toBe("ready");
    expect(onReady).toHaveBeenCalledTimes(1);

    const calls = api.list.mock.calls.length;
    await tick(POLL_INTERVAL_MS * 3);
    expect(api.list).toHaveBeenCalledTimes(calls);
  });

  it("gives up and says so when the image never shows up", async () => {
    const onReady = vi.fn();
    const { result } = renderHook(() => useNewProgramImage(7, file, known, onReady));
    await tick(GIVE_UP_AFTER_MS + POLL_INTERVAL_MS);
    expect(result.current).toBe("stalled");
    expect(onReady).not.toHaveBeenCalled();
  });

  it("starts over for the next upload", async () => {
    const { result, rerender } = renderHook(
      ({ uploaded }: { uploaded: File | null }) => useNewProgramImage(7, uploaded, known, vi.fn()),
      { initialProps: { uploaded: file as File | null } },
    );
    await tick(GIVE_UP_AFTER_MS + POLL_INTERVAL_MS);
    expect(result.current).toBe("stalled");

    rerender({ uploaded: null });
    expect(result.current).toBe("idle");
    rerender({ uploaded: new File(["y"], "annet.png", { type: "image/png" }) });
    expect(result.current).toBe("processing");
  });
});
