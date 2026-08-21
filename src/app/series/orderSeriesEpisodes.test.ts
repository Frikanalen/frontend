import { Video } from "@/generated/frikanalenDjangoAPI.schemas";
import { describe, expect, it } from "vitest";
import { orderSeriesEpisodes } from "./orderSeriesEpisodes";

const episode = (id: number, episodeNumber: number | null) => ({ id, episodeNumber }) as Video;

describe("orderSeriesEpisodes", () => {
  it("orders numbered episodes and puts unnumbered videos last", () => {
    const videos = [episode(30, null), episode(20, 3), episode(10, 1)];

    expect(orderSeriesEpisodes(videos).map(({ id }) => id)).toEqual([10, 20, 30]);
  });

  it("uses the stable video id order when editorial numbering is absent", () => {
    const videos = [episode(30, null), episode(10, null), episode(20, null)];

    expect(orderSeriesEpisodes(videos).map(({ id }) => id)).toEqual([10, 20, 30]);
  });

  it("does not mutate the API response", () => {
    const videos = [episode(20, 2), episode(10, 1)];

    orderSeriesEpisodes(videos);

    expect(videos.map(({ id }) => id)).toEqual([20, 10]);
  });
});
