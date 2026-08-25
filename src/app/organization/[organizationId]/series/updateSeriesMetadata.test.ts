import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateSeriesMetadata } from "./updateSeriesMetadata";
import type { SeriesMetadataState } from "./seriesMetadata";

const api = vi.hoisted(() => ({
  update: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("@/lib/getCookiesFromRequest", () => ({
  getCookiesFromRequest: vi.fn().mockResolvedValue({}),
}));
vi.mock("@/generated/ssr/series/series", () => ({
  ssrSeriesPartialUpdate: api.update,
}));
vi.mock("next/cache", () => ({ refresh: api.refresh }));

const idle: SeriesMetadataState = { status: "idle", message: "" };
const formData = (name = "Havna", synopsis = "Nye historier.") => {
  const data = new FormData();
  data.set("name", name);
  data.set("synopsis", synopsis);
  return data;
};

beforeEach(() => {
  api.update.mockReset().mockResolvedValue({ status: 200, data: {} });
  api.refresh.mockReset();
});

describe("updateSeriesMetadata", () => {
  it("passes the form data to the generated API client and refreshes", async () => {
    const result = await updateSeriesMetadata(4, idle, formData());

    expect(api.update).toHaveBeenCalledWith(
      "4",
      { name: "Havna", synopsis: "Nye historier." },
      expect.objectContaining({ cache: "no-store" }),
    );
    expect(api.refresh).toHaveBeenCalledOnce();
    expect(result).toEqual({ status: "success", message: "Serieopplysningene er lagret." });
  });

  it("surfaces errors returned by the generated API client", async () => {
    api.update.mockResolvedValueOnce({
      status: 400,
      data: {
        errors: [{ attr: "name", code: "blank", detail: "Navn må fylles ut." }],
      },
    });

    const result = await updateSeriesMetadata(4, idle, formData(""));

    expect(result).toEqual({ status: "error", message: "Navn må fylles ut." });
    expect(api.refresh).not.toHaveBeenCalled();
  });
});
