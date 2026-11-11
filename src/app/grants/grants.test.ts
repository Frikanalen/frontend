import { describe, expect, it } from "vitest";
import type { GrantItemVideo } from "@/generated/frikanalenDjangoAPI.schemas";
import {
  deadlineText,
  itemsPayload,
  listMilliseconds,
  moveItem,
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

  it("moves an item and ignores moves off either end", () => {
    expect(moveItem(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
    expect(moveItem(["a", "b", "c"], 2, 1)).toEqual(["a", "c", "b"]);
    expect(moveItem(["a", "b"], 0, -1)).toEqual(["a", "b"]);
  });

  it("explains the deadline by state", () => {
    expect(deadlineText({ state: "open", lockExempt: false }, "mandag 9. november kl. 00:00")).toBe(
      "Listen kan endres til mandag 9. november kl. 00:00.",
    );
    expect(deadlineText({ state: "locked", lockExempt: true }, "x")).toMatch(/Unntatt/);
    expect(deadlineText({ state: "compiled", lockExempt: false }, "x")).toBe("Listen ble låst x.");
  });
});
