import { Video } from "@/generated/frikanalenDjangoAPI.schemas";
import Link from "next/link";
import { ReactNode } from "react";
import { GoPlay } from "react-icons/go";
import { archiveSearchUrl } from "@/app/video/archiveSearchUrl";
import { formatDuration, formatPublished, spokenDuration } from "@/app/video/videoMeta";

/**
 * One video: a still, and beside it everything needed to decide whether to
 * spend the next forty minutes on it.
 *
 * Rows rather than a grid of cards. The stills in this archive are automatic
 * frame grabs from public-access television - a lectern, a logo, a dark room -
 * so they rarely tell two videos apart, while the title, the organization
 * behind it, the date and the running time nearly always do. A row gives that
 * text the width to be read at a glance instead of clamping it into a 240px
 * column, and it puts four or five videos on a phone screen where the grid
 * managed one.
 *
 * The whole row is clickable without the whole row being one link: the title
 * is the real anchor and stretches an invisible ::after over the row, so the
 * organization can keep a link of its own. A row wrapped in a single <a>
 * couldn't, and a screen reader would read the entire block as one long link
 * name.
 */
const VideoRow = ({
  video,
  showOrganization,
  showCategory,
}: {
  video: Video;
  showOrganization: boolean;
  showCategory: boolean;
}) => {
  const duration = video.durationSec;

  // The line under the title, built from whatever this particular video can
  // say. Every field but the name and the id is optional in practice - the
  // archive holds rows imported over fifteen years, and the oldest of them are
  // missing things the current upload flow always sets - and a caller that
  // sits inside one series or one organization switches off the facts its own
  // heading has already given.
  //
  const facts: ReactNode[] = [];
  if (video.episodeNumber) facts.push(`Episode ${video.episodeNumber}`);
  if (video.createdTime)
    facts.push(<time dateTime={video.createdTime}>{formatPublished(video.createdTime)}</time>);
  if (showCategory && video.categories?.[0]) facts.push(video.categories[0]);

  return (
    <li className="group relative flex gap-3 rounded-xl p-2 transition-colors hover:bg-content1 has-[a:focus-visible]:bg-content1 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-focus sm:gap-4 sm:p-3">
      {/*
        The still sits on a tinted well with a play glyph drawn on it, which
        shows through until the image arrives.

        `self-start` because the row is a flex container: without it the well
        stretches to whatever height the text beside it happens to need, and
        the aspect ratio it was given is quietly overruled.

        A good number of these thumbnails 404 - media from 2009 that no longer
        exists - and a broken <img> is not nothing on screen: Chrome and Safari
        draw their own torn-page icon in the corner even when `alt` is empty.
        `after:` is the cure. A pseudo-element on an <img> only renders once
        the image has failed, because a broken image stops being replaced
        content, so a dead thumbnail is covered by a clean tint and a live one
        is untouched. No onError handler, and so no client bundle, for what
        CSS already does.
      */}
      <span className="relative block aspect-video w-32 shrink-0 self-start overflow-hidden rounded-lg bg-content2 sm:w-44 lg:w-52">
        <span aria-hidden className="absolute inset-0 grid place-items-center">
          <GoPlay className="size-6 text-content2-foreground/30" />
        </span>

        {/* Thumbnails live on member-controlled hosts that Next's build-time
            image allowlist cannot know in advance. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          src={video.files.largeThumb?.url}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 size-full object-cover transition-transform duration-300 after:absolute after:inset-0 after:bg-content2 after:content-[''] group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />

        {duration ? (
          <span className="absolute bottom-1 right-1 rounded bg-black/75 px-1.5 py-px text-tiny font-medium tabular-nums text-white">
            {/* Read out as a clock time or as three separate numbers depending
                on the screen reader, so the badge is drawn for the eye and
                spelled out for everyone else. */}
            <span aria-hidden>{formatDuration(duration)}</span>
            <span className="sr-only">Varighet {spokenDuration(duration)}</span>
          </span>
        ) : null}
      </span>

      <div className="flex min-w-0 flex-col gap-0.5 py-0.5">
        <h3 className="text-medium font-semibold leading-snug">
          <Link
            href={`/video/${video.id}`}
            // Stretches the anchor over the row. `outline-hidden` because the
            // focus ring is drawn on the row instead - a ring around just the
            // title, with the row already highlighted behind it, reads as two
            // competing focus indicators.
            className="line-clamp-2 outline-hidden after:absolute after:inset-0 group-hover:underline"
          >
            {video.name}
          </Link>
        </h3>

        {showOrganization && (
          // Positioned so it paints above the title's stretched ::after, which
          // would otherwise swallow the click. It comes later in the DOM, so
          // no z-index is needed to win.
          <Link
            href={archiveSearchUrl({ organization: video.organization.id })}
            className="relative w-fit text-small text-foreground/75 outline-hidden hover:text-foreground hover:underline focus-visible:text-foreground focus-visible:underline"
          >
            {video.organization.name}
          </Link>
        )}

        {!!facts.length && (
          <p className="flex flex-wrap items-center gap-x-2 text-small text-foreground/75">
            {facts.map((fact, index) => (
              // The separator travels with the fact that follows it rather
              // than standing between the two, so a phone that wraps this line
              // doesn't leave a dangling "·" at the end of one.
              <span key={index}>
                {index > 0 && (
                  <span aria-hidden className="pr-2">
                    ·
                  </span>
                )}
                {fact}
              </span>
            ))}
          </p>
        )}
      </div>
    </li>
  );
};

/**
 * A list of videos: the archive's results, an organization's newest, or a
 * series' episodes.
 *
 * An ordered list because the order is always the point - the sort the reader
 * chose, or the editorial order of a series - and because it lets a screen
 * reader say how many there are and how far down one is.
 *
 * `showOrganization` and `showCategory` are off wherever the list already sits
 * under a heading that gives that fact: every video on an organization's page
 * is theirs, and every episode of a series carries the same category. Printing
 * either one on all twenty-four rows tells the reader nothing they aren't
 * already looking at.
 *
 * Row titles are h3: every caller renders the list under a section heading of
 * its own, so the levels don't skip.
 */
export const VideoList = ({
  videos,
  showOrganization = true,
  showCategory = true,
}: {
  videos: Video[];
  showOrganization?: boolean;
  showCategory?: boolean;
}) => (
  <ol className="-mx-2 flex flex-col sm:-mx-3">
    {videos.map((video) => (
      <VideoRow
        key={video.id}
        video={video}
        showOrganization={showOrganization}
        showCategory={showCategory}
      />
    ))}
  </ol>
);
