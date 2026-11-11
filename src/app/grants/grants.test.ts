import { describe, expect, it } from "vitest";
import type { GrantItemVideo } from "@/generated/frikanalenDjangoAPI.schemas";
import {
  deadlineText,
  readOnlyReason,
  itemsPayload,
  listMilliseconds,
  placeItems,
  sameList,
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
    liveSource: null,
  } satisfies GrantItemVideo,
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

  it("compares lists by the videos they play, in order", () => {
    expect(
      sameList([video(1, "00:01:00"), video(2, "00:01:00")], [video(1, "x"), video(2, "y")]),
    ).toBe(true);
    expect(
      sameList([video(1, "00:01:00"), video(2, "00:01:00")], [video(2, "x"), video(1, "y")]),
    ).toBe(false);
    expect(sameList([video(1, "00:01:00")], [])).toBe(false);
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

  const future = { starttime: "2030-01-14T17:00:00Z", endtime: "2030-01-14T18:00:00Z" };
  const now = Date.parse("2030-01-14T12:00:00Z");

  it("explains the deadline by state", () => {
    expect(
      deadlineText(
        { ...future, state: "open", lockExempt: false },
        "mandag 9. november kl. 00:00",
        now,
      ),
    ).toBe("Listen kan endres til mandag 9. november kl. 00:00.");
    expect(deadlineText({ ...future, state: "locked", lockExempt: true }, "x", now)).toMatch(
      /Unntatt/,
    );
    expect(deadlineText({ ...future, state: "compiled", lockExempt: false }, "x", now)).toBe(
      "Listen ble låst x.",
    );
  });

  it("doesn't promise edits on a grant that has aired", () => {
    const later = Date.parse("2030-01-14T19:00:00Z");
    expect(deadlineText({ ...future, state: "compiled", lockExempt: true }, "x", later)).toBe(
      "Sendetiden er over.",
    );
  });

  it("says why a grant is read-only", () => {
    const grant = {
      ...future,
      state: "open" as const,
      lockExempt: false,
      locksAt: "2030-01-10T00:00:00Z",
    };
    expect(readOnlyReason(grant, Date.parse("2030-01-14T19:00:00Z"))).toMatch(/er over/);
    expect(readOnlyReason(grant, Date.parse("2030-01-14T17:30:00Z"))).toMatch(/på lufta/);
    expect(readOnlyReason(grant, now)).toMatch(/låst/);
    expect(readOnlyReason({ ...grant, lockExempt: true }, now)).toMatch(/ikke tilgang/);
  });
});
