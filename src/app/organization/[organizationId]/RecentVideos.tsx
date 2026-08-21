import Link from "next/link";
import { Organization } from "@/generated/frikanalenDjangoAPI.schemas";
import { ssrVideosList } from "@/generated/ssr/videos/videos";
import { VideoGrid } from "@/app/video/VideoGrid";
import { archiveSearchUrl } from "@/app/video/archiveSearchUrl";

/** Enough to fill three rows of the grid on a wide screen. */
const RECENT_LIMIT = 12;

/**
 * The newest handful of an organization's videos, and a way through to the
 * rest: several organizations here have hundreds, and a fixed-length list is
 * otherwise a dead end.
 *
 * `publish_on_web` is the backend's own definition of a public video and the
 * list endpoint does not apply it on its own, so without it this section
 * shows drafts and test uploads to anyone who visits. No cookies are
 * forwarded for the same reason: this is the organization's public profile,
 * and an admin looking at it should see what everyone else sees.
 */
export const RecentVideos = async ({ organization }: { organization: Organization }) => {
  // Explicitly newest-first by id. `created_time` looks like the obvious sort
  // key but gets rewritten by re-imports, which floats decade-old material to
  // the top; ids only ever ascend.
  const response = await ssrVideosList(
    {
      organization: organization.id,
      publish_on_web: true,
      ordering: "-id",
      limit: RECENT_LIMIT,
    },
    { cache: "no-store" },
  ).catch((error: unknown) => {
    console.error(`Recent videos for organization ${organization.id} failed to load:`, error);
    return null;
  });

  if (response?.status !== 200)
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-bold">Videoer</h2>
        <p role="alert" className="text-foreground/75">
          Fikk ikke hentet videoene til {organization.name}. Prøv igjen om litt.
        </p>
      </section>
    );

  const { count, results } = response.data;

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold">Videoer</h2>

      {results.length ? (
        <>
          <VideoGrid videos={results} showOrganization={false} headingLevel={3} />
          {count > results.length && (
            <p>
              <Link
                className="underline"
                href={archiveSearchUrl({ organization: organization.id })}
              >
                Se alle {count} videoer fra {organization.name}
              </Link>
            </p>
          )}
        </>
      ) : (
        <p className="text-foreground/75">
          {organization.name} har ikke publisert noen videoer ennå.
        </p>
      )}
    </section>
  );
};
