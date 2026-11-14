import { describe, expect, it } from "vitest";
import type { GrantItemPoster, GrantItemVideo } from "@/generated/frikanalenDjangoAPI.schemas";
import {
  deadlineText,
  readOnlyReason,
  itemsPayload,
  listMilliseconds,
  placeItems,
  roomForPoster,
  roomForProgramme,
  sameList,
  fillSourceLabel,
  ownerChoosesSource,
  splitItems,
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
  poster: null,
});

const poster = (id: number, duration: string): DraftItem => ({
  video: null,
  poster: {
    id,
    template: "paper",
    heading: `Plakat ${id}`,
    text: "",
    duration,
  } satisfies GrantItemPoster,
});

const hour = { starttime: "2026-11-16T18:00:00Z", endtime: "2026-11-16T19:00:00Z" };
const starts = (items: DraftItem[], window: typeof hour & { padded?: boolean } = hour) =>
  timeline(items, window).rows.map(({ start }) => start.toISOString().slice(11, 19));

describe("grant lists", () => {
  it("measures the window", () => {
    expect(
      windowMilliseconds({ starttime: "2026-11-16T18:00:00Z", endtime: "2026-11-16T19:00:00Z" }),
    ).toBe(3_600_000);
  });

  it("adds up a jukebox list back to back, counting unknown lengths as zero", () => {
    expect(
      listMilliseconds([video(1, "00:10:00.500000"), video(2, ""), video(3, "00:20:00")], {
        ...hour,
        padded: false,
      }),
    ).toBe(1_800_500);
  });

  it("starts each programme on the five-minute grid, with a breather", () => {
    // 18:04:31 + 30 s rounds to 18:10; 18:14 + 30 s to 18:15; 18:20 exactly
    // still gets a gap, to 18:25.
    expect(
      starts([
        video(1, "00:04:31"),
        video(2, "00:04:00"),
        video(3, "00:05:00"),
        video(4, "00:01:00"),
      ]),
    ).toEqual(["18:00:00", "18:10:00", "18:15:00", "18:25:00"]);
  });

  it("plays a poster right after what is before it", () => {
    expect(starts([video(1, "00:12:00"), poster(1, "00:00:30"), video(2, "00:01:00")])).toEqual([
      "18:00:00",
      "18:12:00",
      "18:15:00",
    ]);
  });

  it("says where the graphics go between programmes", () => {
    const { rows } = timeline([video(1, "00:12:00"), video(2, "00:01:00")], hour);
    expect(rows[0].gapBefore).toBeNull();
    expect(rows[1].gapBefore?.start.toISOString()).toBe("2026-11-16T18:12:00.000Z");
    expect(rows[1].gapBefore?.end.toISOString()).toBe("2026-11-16T18:15:00.000Z");
  });

  it("knows how much room is left for a programme and for a poster", () => {
    const list = [video(1, "00:12:00")];
    expect(roomForProgramme(list, hour)).toBe(45 * 60_000);
    expect(roomForPoster(list, hour)).toBe(48 * 60_000);
    expect(roomForProgramme([], hour)).toBe(60 * 60_000);
  });

  it("sends the whole list in order without positions", () => {
    expect(itemsPayload([video(5, "00:01:00"), poster(3, "00:00:30")])).toEqual([
      { video: 5 },
      { poster: 3 },
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
    expect(sameList([video(1, "00:01:00")], [poster(1, "00:01:00")])).toBe(false);
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

  it("lays the list out and leaves the rest to graphics", () => {
    const { rows, graphics } = timeline([video(1, "00:20:00"), video(2, "00:15:00")], hour);

    expect(rows.map(({ start, end }) => [start.toISOString(), end.toISOString()])).toEqual([
      ["2026-11-16T18:00:00.000Z", "2026-11-16T18:20:00.000Z"],
      ["2026-11-16T18:25:00.000Z", "2026-11-16T18:40:00.000Z"],
    ]);
    expect(graphics?.start.toISOString()).toBe("2026-11-16T18:40:00.000Z");
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

const uploads = { id: 4, kind: "uploads", description: "", seriesName: null } as const;

describe("fillSourceLabel", () => {
  it("names what a self-filling grant draws on", () => {
    expect(fillSourceLabel({ recipe: uploads })).toBe("alt dere laster opp");
    expect(
      fillSourceLabel({ recipe: { ...uploads, kind: "series", series: 8, seriesName: "Ukens" } }),
    ).toBe("serien «Ukens»");
    expect(fillSourceLabel({ recipe: { ...uploads, kind: "jukebox", name: "Kulturnatt" } })).toBe(
      "videojukeboksen «Kulturnatt»",
    );
  });

  it("leaves a playlist or the jukebox to staff", () => {
    expect(ownerChoosesSource({ recipe: null })).toBe(true);
    expect(ownerChoosesSource({ recipe: uploads })).toBe(true);
    expect(ownerChoosesSource({ recipe: { ...uploads, kind: "jukebox" } })).toBe(false);
  });
});

describe("splitItems", () => {
  const items = [
    { ...video(1, "00:10:00"), pinned: true },
    { ...video(2, "00:10:00"), pinned: false },
  ];

  it("separates what the owner pinned from what the rule filled", () => {
    const { chosen, filled } = splitItems({ recipe: uploads }, items);
    expect(chosen.map((item) => item.video?.id)).toEqual([1]);
    expect(filled.map((item) => item.video?.id)).toEqual([2]);
  });

  it("treats a hand-made list as all the owner's", () => {
    const { chosen, filled } = splitItems({ recipe: null }, items);
    expect(chosen).toHaveLength(2);
    expect(filled).toEqual([]);
  });
});
