import { Video } from "@/generated/frikanalenDjangoAPI.schemas";

/**
 * Put numbered episodes in editorial order and leave unnumbered videos at the
 * end in their stable creation order. `toSorted` keeps the API response intact
 * for any other consumer on the page.
 */
export const orderSeriesEpisodes = (videos: Video[]) =>
  videos.toSorted(
    (left, right) =>
      (left.episodeNumber ?? Number.MAX_SAFE_INTEGER) -
        (right.episodeNumber ?? Number.MAX_SAFE_INTEGER) || left.id - right.id,
  );
