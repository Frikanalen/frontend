import Link from "next/link";

// Shown in place of a video staff have removed (is_banned). To the public it
// says only that the video is unavailable: the API withholds why, and whose
// it was. The video's own organization is told a little more.
export const REMOVED_HEADING = "Denne videoen er utilgjengelig";
export const REMOVED_FOR_OWNER =
  "Videoen er administrativt fjernet i påvente av gjennomgang. Den vises ikke for andre og blir ikke sendt. Andre ser bare at den er utilgjengelig.";

type Organization = { id: number; name: string };

export function RemovedNotice({ ownOrganization }: { ownOrganization?: Organization | null }) {
  return (
    <article className="prose dark:prose-invert max-w-2xl" aria-labelledby="removed-heading">
      {ownOrganization && (
        <p className="text-sm uppercase tracking-wide">
          Denne videoen er fra{" "}
          <Link href={`/organization/${ownOrganization.id}`}>{ownOrganization.name}</Link>
        </p>
      )}
      <h1 id="removed-heading">{REMOVED_HEADING}</h1>
      {ownOrganization && <p>{REMOVED_FOR_OWNER}</p>}
    </article>
  );
}

/** Whether a video endpoint's 403 says staff removed the video. */
export function isRemovedVideo(body: unknown): boolean {
  if (typeof body !== "object" || body === null) return false;
  return (body as { code?: unknown }).code === "video_removed";
}

/** The caller's own organization, named only when the video is theirs. */
export function removedVideoOwnerFrom(body: unknown): Organization | null {
  if (!isRemovedVideo(body)) return null;
  const { organization } = body as { organization?: Organization };
  return organization ?? null;
}
