import Link from "next/link";
import { Video } from "@/generated/frikanalenDjangoAPI.schemas";
import { formatDuration } from "@/app/video/videoMeta";

/** The newest programmes in the archive, as stills with a title under each. */
export const FromArchive = ({ videos }: { videos: Video[] }) =>
  videos.length === 0 ? null : (
    <section aria-labelledby="archive-heading" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t-2 border-foreground pt-4">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl" id="archive-heading">
          Nytt i arkivet
        </h2>
        <Link className="py-1 font-semibold text-primary-700 hover:underline" href="/video">
          Se hele arkivet →
        </Link>
      </div>
      <ul className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        {videos.map((video) => (
          <li className="group relative flex min-w-0 flex-col gap-3" key={video.id}>
            <div className="relative aspect-video overflow-hidden bg-default-200">
              {video.files?.largeThumb?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                  src={video.files.largeThumb.url}
                />
              ) : null}
              {video.durationSec ? (
                <span className="absolute right-2 bottom-2 bg-stage px-1.5 py-0.5 text-xs font-semibold text-stage-foreground tabular-nums">
                  {formatDuration(video.durationSec)}
                </span>
              ) : null}
            </div>
            <div className="min-w-0">
              <h3 className="text-lg leading-snug font-bold">
                {/* The title is the anchor and stretches over the whole card,
                    so the organisation below can keep a link of its own. */}
                <Link
                  className="after:absolute after:inset-0 group-hover:underline"
                  href={`/video/${video.id}`}
                >
                  {video.name}
                </Link>
              </h3>
              <p className="mt-1 truncate text-default-600">
                <Link
                  className="relative z-10 hover:text-foreground hover:underline"
                  href={`/organization/${video.organization.id}`}
                >
                  {video.organization.name}
                </Link>
                {video.categories?.[0] ? ` · ${video.categories[0]}` : ""}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
