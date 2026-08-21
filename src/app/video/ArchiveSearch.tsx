"use client";

import { Video } from "@/generated/frikanalenDjangoAPI.schemas";
import { useVideosList } from "@/generated/videos/videos";
import { keepPreviousData } from "@tanstack/react-query";
import { Image } from "@heroui/react";
import { useRouter } from "next/navigation";
import { FormEvent, KeyboardEvent, useId, useState } from "react";
import { GoSearch } from "react-icons/go";
import { useDebounce } from "react-use";
import { ArchiveScope, archiveSearchUrl } from "@/app/video/archiveSearchUrl";

/** A single letter matches most of the archive, so its suggestions are noise. */
const MIN_QUERY_LENGTH = 2;
const SUGGESTION_LIMIT = 6;
const DEBOUNCE_MS = 200;

const optionClassName = (isActive: boolean) =>
  `flex cursor-pointer items-center gap-3 p-2 ${isActive ? "bg-content2 text-content2-foreground" : ""}`;

/**
 * Combobox over the video archive: suggestions as you type, and the whole
 * query on Enter.
 *
 * Hand-rolled rather than built on HeroUI's Autocomplete because the two
 * Enters have to mean different things - "open the video I arrowed to" and
 * "search for what I typed" - and react-aria's combobox chains a consumer's
 * onKeyDown after its own selection handling, so both would fire on one
 * keystroke. Owning the key handling keeps them apart.
 *
 * The last row of the list is the search itself, so the results page is
 * reachable by pointer and by arrow key, not only by knowing to press Enter.
 *
 * The form is a plain GET to /video, so Enter still searches if the client
 * bundle hasn't loaded; onSubmit only upgrades that to a client-side
 * navigation.
 *
 * A `scope` narrows every one of those paths - suggestions, Enter, the
 * submit button and the no-JS GET - to a single organization, so the box on
 * an organization's page searches that organization rather than the archive.
 */
export const ArchiveSearch = ({
  initialQuery = "",
  scope,
}: {
  initialQuery?: string;
  scope?: ArchiveScope;
}) => {
  const router = useRouter();
  const label = scope ? `Søk i videoer fra ${scope.name}` : "Søk i arkivet";
  const [query, setQuery] = useState(initialQuery);
  const [suggestFor, setSuggestFor] = useState(initialQuery.trim());
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listboxId = useId();
  const optionId = (index: number) => `${listboxId}-option-${index}`;

  useDebounce(
    () => {
      // A fresh query renumbers the list, so the highlight has to let go of
      // the position it was holding in the old one.
      setSuggestFor(query.trim());
      setActiveIndex(-1);
    },
    DEBOUNCE_MS,
    [query],
  );

  // Tied to the panel, not merely to the text, because the results page hands
  // this component the query it is already showing. Suggesting against a
  // closed panel would fetch a list nobody asked for on every results page,
  // and announce it to anyone listening.
  const isPanelOpen = isOpen && suggestFor.length >= MIN_QUERY_LENGTH;

  const { data, isFetching, isError } = useVideosList(
    { q: suggestFor, publish_on_web: true, limit: SUGGESTION_LIMIT, organization: scope?.id },
    {
      query: {
        enabled: isPanelOpen,
        // Holding the previous list while the next one loads keeps the panel
        // from collapsing and reopening under the pointer on every keystroke.
        placeholderData: keepPreviousData,
      },
    },
  );

  // `enabled` stops the request, but react-query still hands back the previous
  // query's data as placeholder - which would leave suggestions on screen for
  // an input too short, or too closed, to have earned them.
  const suggestions = isPanelOpen ? (data?.data.results ?? []) : [];
  const searchIndex = suggestions.length;

  // Sighted users can see the list appear; this is the same news for anyone
  // who can't. It lives outside the panel and stays mounted, because a live
  // region inserted with its text already in place is announced unreliably.
  const status = !isPanelOpen
    ? ""
    : isFetching
      ? "Søker …"
      : isError
        ? "Fikk ikke hentet forslag."
        : suggestions.length
          ? `${suggestions.length} forslag`
          : `Ingen treff på «${suggestFor}».`;

  const openVideo = (video: Video) => {
    setIsOpen(false);
    router.push(`/video/${video.id}`);
  };

  const runSearch = () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setIsOpen(false);
    router.push(archiveSearchUrl({ query: trimmed, organization: scope?.id }));
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const highlighted = activeIndex >= 0 ? suggestions[activeIndex] : undefined;
    return highlighted ? openVideo(highlighted) : runSearch();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

    // Without this the caret jumps to either end of the field while arrowing
    // through the list.
    event.preventDefault();
    setIsOpen(true);

    const step = event.key === "ArrowDown" ? 1 : -1;
    const count = suggestions.length + 1;
    setActiveIndex((index) =>
      index < 0 ? (step > 0 ? 0 : count - 1) : (index + step + count) % count,
    );
  };

  return (
    <search>
      <form className="relative" action="/video" method="get" onSubmit={onSubmit}>
        <label className="sr-only" htmlFor={`${listboxId}-input`}>
          {label}
        </label>

        {/*
          Keeps the narrowing on the query string when the form submits as a
          plain GET, so a visitor without the client bundle searches the
          organization they were looking at rather than the whole archive.
        */}
        {scope && <input type="hidden" name="organization" value={scope.id} />}
        <input
          id={`${listboxId}-input`}
          name="q"
          type="text"
          role="combobox"
          autoComplete="off"
          enterKeyHint="search"
          placeholder={label}
          value={query}
          aria-autocomplete="list"
          // Only while the listbox exists: an IDREF to an element that was
          // never rendered is a dangling reference.
          aria-controls={isPanelOpen ? listboxId : undefined}
          aria-expanded={isPanelOpen}
          aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
          className="w-full rounded-xl bg-background py-3 pl-4 pr-14 text-lg shadow-lg ring-1 ring-default-300 outline-hidden placeholder:text-foreground/75 focus:ring-2 focus:ring-focus"
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            setIsOpen(false);
            // Otherwise a highlight left over from last time decides what the
            // next Enter does, long after the list that explained it is gone.
            setActiveIndex(-1);
          }}
          onKeyDown={onKeyDown}
        />

        {/*
          A real submit button rather than a decorative icon: it gives pointer
          users a way to run the search, and it keeps Enter submitting even if
          the form ever grows a second field, which would otherwise switch off
          the browser's implicit submission. It follows the field in the DOM so
          Tab reaches the field first. Preventing mousedown keeps focus in the
          field, so the suggestion panel survives the click.
        */}
        <button
          type="submit"
          aria-label="Søk"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-foreground/75 outline-hidden hover:text-foreground focus-visible:ring-2 focus-visible:ring-focus"
          onMouseDown={(event) => event.preventDefault()}
        >
          <GoSearch aria-hidden className="size-5" />
        </button>

        <p role="status" className="sr-only">
          {status}
        </p>

        {isPanelOpen && (
          // Preventing mousedown keeps focus in the input, so onBlur can't
          // close the panel out from under the click landing on it. The click
          // itself still fires.
          <div
            className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl bg-background shadow-xl ring-1 ring-default-300"
            onMouseDown={(event) => event.preventDefault()}
          >
            {!suggestions.length && (
              // aria-hidden: the status region above already says this, and
              // saying it twice is worse than saying it once.
              <p aria-hidden className="px-4 pt-4 text-sm text-foreground/75">
                {status}
              </p>
            )}

            <ul id={listboxId} role="listbox" aria-label="Forslag">
              {suggestions.map((video, index) => (
                <li
                  key={video.id}
                  id={optionId(index)}
                  role="option"
                  aria-selected={index === activeIndex || undefined}
                  className={optionClassName(index === activeIndex)}
                  onMouseMove={() => setActiveIndex(index)}
                  onClick={() => openVideo(video)}
                >
                  <Image
                    removeWrapper
                    disableSkeleton
                    alt=""
                    src={video.largeThumbnailUrl}
                    width={96}
                    height={54}
                    className="aspect-video w-24 shrink-0 rounded-md object-cover"
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{video.name}</span>
                    <span className="block truncate text-sm text-foreground/75">
                      {video.organization.name}
                    </span>
                  </span>
                </li>
              ))}

              <li
                id={optionId(searchIndex)}
                role="option"
                aria-selected={activeIndex === searchIndex || undefined}
                className={`${optionClassName(activeIndex === searchIndex)} border-t border-default-200 p-3 text-sm`}
                onMouseMove={() => setActiveIndex(searchIndex)}
                onClick={runSearch}
              >
                <GoSearch aria-hidden className="size-4 shrink-0" />
                Vis alle treff på «{suggestFor}»{scope && ` fra ${scope.name}`}
              </li>
            </ul>
          </div>
        )}
      </form>
    </search>
  );
};
