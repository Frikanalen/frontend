import { describe, expect, it } from "vitest";
import {
  OrganizationSeriesParams,
  ScheduleDateParams,
  VideoParams,
  parseParamsOr404,
} from "@/lib/routeParams";

const params = (value: Record<string, string>) => Promise.resolve(value);

describe("parseParamsOr404", () => {
  it("hands back the id the URL names, as a number", async () => {
    await expect(parseParamsOr404(VideoParams, params({ videoId: "42" }))).resolves.toEqual({
      videoId: 42,
    });
  });

  it("parses every param a route declares", async () => {
    await expect(
      parseParamsOr404(OrganizationSeriesParams, params({ organizationId: "3", seriesId: "7" })),
    ).resolves.toEqual({ organizationId: 3, seriesId: 7 });
  });

  it.each(["abc", "", "1.5", "0", "-1"])("renders 404 for %o, which names nothing", async (id) => {
    // notFound() signals the 404 by throwing; the assertion is that it is
    // reached at all, rather than a ZodError escaping as a 500.
    await expect(parseParamsOr404(VideoParams, params({ videoId: id }))).rejects.toThrow();
  });
});

describe("ScheduleDateParams", () => {
  it("keeps the padded segments the URL carried", async () => {
    await expect(
      parseParamsOr404(ScheduleDateParams, params({ year: "2026", month: "08", date: "27" })),
    ).resolves.toEqual({ year: "2026", month: "08", date: "27" });
  });

  it("accepts a leap day the year actually has", async () => {
    await expect(
      parseParamsOr404(ScheduleDateParams, params({ year: "2028", month: "02", date: "29" })),
    ).resolves.toMatchObject({ date: "29" });
  });

  // Date rolls 31 February forward to 3 March rather than rejecting it, so a
  // day that names nothing has to 404 rather than quietly show another day.
  it.each([
    { year: "2026", month: "02", date: "31" },
    { year: "2026", month: "02", date: "29" },
    { year: "2026", month: "13", date: "01" },
    { year: "2026", month: "00", date: "10" },
    { year: "2026", month: "8", date: "27" },
    { year: "26", month: "08", date: "27" },
    { year: "2026", month: "08", date: "0" },
  ])("renders 404 for %o", async (day) => {
    await expect(parseParamsOr404(ScheduleDateParams, params(day))).rejects.toThrow();
  });
});
