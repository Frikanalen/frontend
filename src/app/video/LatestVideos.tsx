import { ssrVideosList } from "@/generated/ssr/videos/videos";
import { VideoGrid } from "@/app/video/VideoGrid";

/** Two full rows on a wide screen, and a short scroll on a narrow one. */
const LATEST_COUNT = 12;

const HEADING_ID = "archive-latest";

/**
 * What the archive shows someone who hasn't searched yet: the videos that
 * arrived most recently.
 *
 * Deliberately no `ordering`. The Video model's own default is `-id`, which
 * is the order records were created in; `-uploaded_time` looks like the more
 * honest field but is nullable, and Postgres sorts nulls first on a
 * descending order, so the legacy rows that never got an upload time would
 * take the whole of the first page.
 *
 * `publish_on_web` has to be asked for: the list endpoint doesn't apply the
 * backend's own definition of a public video on its own. Failed ingests are
 * already excluded, by the view's `proper_import` queryset.
 */
export const LatestVideos = async () => {
  // A backend that is down reports itself here rather than taking the page
  // with it - the search box above is the part that has to survive.
  const response = await ssrVideosList(
    { publish_on_web: true, limit: LATEST_COUNT },
    { cache: "no-store" },
  ).catch((error: unknown) => {
    console.error("Archive could not fetch the most recent videos:", error);
    return null;
  });

  if (response?.status !== 200)
    return (
      <p className="text-small text-foreground/75">
        Fikk ikke hentet de nyeste videoene. Søket over virker fortsatt.
      </p>
    );

  const { results } = response.data;

  if (!results.length) return null;

  return (
    <section aria-labelledby={HEADING_ID} className="space-y-4">
      <h2 id={HEADING_ID} className="text-lg font-bold">
        Nylig lagt til
      </h2>

      <VideoGrid videos={results} headingLevel={3} />
    </section>
  );
};
