import { describe, expect, it } from "vitest";
import type { GrantItemVideo } from "@/generated/frikanalenDjangoAPI.schemas";
import {
  deadlineText,
  itemsPayload,
  listMilliseconds,
  placeItems,
  timeline,
  windowMilliseconds,
  type DraftItem,
} from "./grants";

const video = (id: number, duration: string): DraftItem => ({
  video: {
    id,
    name: `Video ${id}`,
    duration,
    organization: { id: 1, name: "Org" },
    pendingUpload: false,
  } satisfies GrantItemVideo,
  liveTransmission: null,
});

describe("grant lists", () => {
  it("measures the window", () => {
    expect(
      windowMilliseconds({ starttime: "2026-11-16T18:00:00Z", endtime: "2026-11-16T19:00:00Z" }),
    ).toBe(3_600_000);
  });

  it("adds up the list back to back, counting unknown lengths as zero", () => {
    expect(
      listMilliseconds([video(1, "00:10:00.500000"), video(2, ""), video(3, "00:20:00")]),
    ).toBe(1_800_500);
  });

  it("sends the whole list in order without positions", () => {
    expect(itemsPayload([video(5, "00:01:00"), video(2, "00:01:00")])).toEqual([
      { video: 5 },
      { video: 2 },
    ]);
  });

  it("places entries before or after a target, moving ones already listed", () => {
    const keyed = (key: string) => ({ ...video(1, "00:01:00"), key });
    const [a, b, c] = [keyed("a"), keyed("b"), keyed("c")];
    const keys = (items: { key: string }[]) => items.map(({ key }) => key);

    expect(keys(placeItems([a, b, c], [a], "c", "after"))).toEqual(["b", "c", "a"]);
    expect(keys(placeItems([a, b, c], [c], "a", "before"))).toEqual(["c", "a", "b"]);
    expect(keys(placeItems([a, b], [keyed("new")], "a", "after"))).toEqual(["a", "new", "b"]);
    expect(keys(placeItems([a], [keyed("new")], null, "after"))).toEqual(["a", "new"]);
  });

  it("lays the list out back to back and leaves the rest to graphics", () => {
    const window = { starttime: "2026-11-16T18:00:00Z", endtime: "2026-11-16T19:00:00Z" };
    const { rows, graphics } = timeline([video(1, "00:20:00"), video(2, "00:15:00")], window);

    expect(rows.map(({ start, end }) => [start.toISOString(), end.toISOString()])).toEqual([
      ["2026-11-16T18:00:00.000Z", "2026-11-16T18:20:00.000Z"],
      ["2026-11-16T18:20:00.000Z", "2026-11-16T18:35:00.000Z"],
    ]);
    expect(graphics?.start.toISOString()).toBe("2026-11-16T18:35:00.000Z");
  });

  it("flags entries that run past the window and leaves no graphics", () => {
    const window = { starttime: "2026-11-16T18:00:00Z", endtime: "2026-11-16T18:30:00Z" };
    const { rows, graphics } = timeline([video(1, "00:20:00"), video(2, "00:15:00")], window);

    expect(rows.map(({ overruns }) => overruns)).toEqual([false, true]);
    expect(graphics).toBeNull();
  });

  it("explains the deadline by state", () => {
    expect(deadlineText({ state: "open", lockExempt: false }, "mandag 9. november kl. 00:00")).toBe(
      "Listen kan endres til mandag 9. november kl. 00:00.",
    );
    expect(deadlineText({ state: "locked", lockExempt: true }, "x")).toMatch(/Unntatt/);
    expect(deadlineText({ state: "compiled", lockExempt: false }, "x")).toBe("Listen ble låst x.");
  });
});
