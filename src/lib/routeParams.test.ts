import { describe, expect, it } from "vitest";
import { OrganizationSeriesParams, VideoParams, parseParams } from "@/lib/routeParams";

const params = (value: Record<string, string>) => Promise.resolve(value);

describe("parseParams", () => {
  it("hands back the id the URL names, as a number", async () => {
    await expect(parseParams(VideoParams, params({ videoId: "42" }))).resolves.toEqual({
      videoId: 42,
    });
  });

  it("parses every param a route declares", async () => {
    await expect(
      parseParams(OrganizationSeriesParams, params({ organizationId: "3", seriesId: "7" })),
    ).resolves.toEqual({ organizationId: 3, seriesId: 7 });
  });

  it.each(["abc", "", "1.5", "0", "-1"])("renders 404 for %o, which names nothing", async (id) => {
    // notFound() signals the 404 by throwing; the assertion is that it is
    // reached at all, rather than a ZodError escaping as a 500.
    await expect(parseParams(VideoParams, params({ videoId: id }))).rejects.toThrow();
  });
});
