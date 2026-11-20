// Shown in place of a video staff have removed (is_banned). Deliberately
// says nothing about why, or whose video it was: the API withholds both.
export const REMOVED_HEADING = "Administrativt fjernet";
export const REMOVED_TEXT = "Denne videoen er administrativt fjernet i påvente av gjennomgang.";

export function RemovedNotice() {
  return (
    <article className="prose dark:prose-invert max-w-2xl" aria-labelledby="removed-heading">
      <h1 id="removed-heading">{REMOVED_HEADING}</h1>
      <p>{REMOVED_TEXT}</p>
    </article>
  );
}

/** Whether a video endpoint's 403 says staff removed the video. */
export function isRemovedVideo(body: unknown): boolean {
  if (typeof body !== "object" || body === null) return false;
  return (body as { code?: unknown }).code === "video_removed";
}
