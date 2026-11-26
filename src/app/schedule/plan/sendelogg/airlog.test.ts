import { describe, expect, it } from "vitest";
import {
  epgRow,
  instantAt,
  osloClockOf,
  osloDateOf,
  osloDay,
  osloInstant,
  playlistUrl,
  rowAt,
  spanPosition,
} from "./airlog";

describe("air log helpers", () => {
  it("reads a day on Oslo's clock", () => {
    const day = osloDay("2026-11-25");
    expect(day.start.toISOString()).toBe("2026-11-24T23:00:00.000Z");
    expect(day.end.toISOString()).toBe("2026-11-25T23:00:00.000Z");
  });

  it("gives the day the clocks go back its 25 hours", () => {
    const day = osloDay("2026-10-25");
    expect((day.end.getTime() - day.start.getTime()) / 3600_000).toBe(25);
  });

  it("turns Oslo wall-clock times into instants and back", () => {
    const instant = osloInstant("2026-07-01", "16:05");
    expect(instant.toISOString()).toBe("2026-07-01T14:05:00.000Z");
    expect(osloDateOf(instant)).toBe("2026-07-01");
    expect(osloClockOf(instant)).toBe("16:05:00");
  });

  it("asks for a three-hour playlist from the chosen moment", () => {
    const url = new URL(playlistUrl(new Date("2026-11-25T15:00:00Z")), "https://example.test");
    expect(url.pathname).toBe("/api/airlog/playlist.m3u8");
    expect(url.searchParams.get("start")).toBe("2026-11-25T15:00:00.000Z");
    expect(url.searchParams.get("end")).toBe("2026-11-25T18:00:00.000Z");
  });

  it("places spans on the day's timeline, clipped to the day", () => {
    const day = osloDay("2026-11-25");
    expect(
      spanPosition({ start: "2026-11-24T22:00:00Z", end: "2026-11-25T05:00:00Z" }, day),
    ).toEqual({ left: 0, width: 25 });
    expect(instantAt(0.5, day).toISOString()).toBe("2026-11-25T11:00:00.000Z");
  });
});

describe("air log programme list", () => {
  const item = {
    id: 1,
    starttime: "2026-11-25T18:00:00Z",
    endtime: "2026-11-25T19:00:00Z",
    defaultName: "",
    isLive: false,
    video: { name: "Democracy Now!", organization: { name: "Frikanalen" } },
  };

  it("names a programme by its video and maker", () => {
    expect(epgRow(item)).toMatchObject({
      title: "Democracy Now!",
      organization: "Frikanalen",
      kind: "video",
    });
    expect(epgRow({ ...item, isLive: true }).kind).toBe("live");
  });

  it("names posters, graphics and leftovers", () => {
    const bare = { ...item, video: null };
    expect(
      epgRow({ ...bare, poster: { heading: "Velkommen", organization: { name: "NUUG" } } }),
    ).toMatchObject({ title: "Velkommen", organization: "NUUG", kind: "poster" });
    expect(epgRow({ ...bare, graphic: { name: "Været" } })).toMatchObject({
      title: "Været",
      kind: "graphic",
    });
    expect(epgRow({ ...bare, defaultName: "Pause" }).title).toBe("Pause");
  });

  it("finds the row on air at a moment", () => {
    const rows = [
      epgRow(item),
      epgRow({ ...item, id: 2, starttime: item.endtime, endtime: "2026-11-25T20:00:00Z" }),
    ];
    expect(rowAt(rows, new Date("2026-11-25T19:00:00Z"))?.id).toBe(2);
    expect(rowAt(rows, new Date("2026-11-25T17:59:59Z"))).toBeUndefined();
    expect(rowAt(rows, null)).toBeUndefined();
  });
});
