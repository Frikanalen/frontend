"use client";
import cx from "classnames";
import { useEffect, useState } from "react";
import { useSeriesList } from "@/generated/series/series";
import { useVideosList } from "@/generated/videos/videos";
import { VideoList } from "@/app/video/VideoList";
import { useVideoDeletion } from "@/app/organization/[organizationId]/useVideoDeletion";
import { VideoRowMenu } from "@/app/organization/[organizationId]/VideoRowMenu";

/** A screenful of rows, and few enough that paging is quick. */
export const PAGE_SIZE = 25;

type Visibility = "all" | "public" | "hidden";

const VISIBILITY: { key: Visibility; label: string }[] = [
  { key: "all", label: "Alle" },
  { key: "public", label: "Offentlige" },
  { key: "hidden", label: "Skjulte" },
];

/** The range shown, as "1–25 av 137". */
export const rangeText = (offset: number, shown: number, count: number) =>
  shown === 0 ? `0 av ${count}` : `${offset + 1}–${offset + shown} av ${count}`;

/**
 * The organization's finished videos, as its own members work on them: every
 * one of them, a page at a time, searchable and narrowed by visibility or
 * series. A row opens the video's editor; its public page and deleting are in
 * the row's menu.
 */
export const OrgVideosList = ({ organizationId }: { organizationId: number }) => {
  const { remove, isRemoving, error } = useVideoDeletion();
  const [page, setPage] = useState(0);
  const [visibility, setVisibility] = useState<Visibility>("all");
  const [series, setSeries] = useState<number | undefined>();
  const [typed, setTyped] = useState("");
  const [query, setQuery] = useState("");

  // Searching as one types, but not one request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      const next = typed.trim();
      if (next === query) return;
      setQuery(next);
      // A new narrowing starts on its first page.
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [typed, query]);

  const seriesList = useSeriesList({ organization: organizationId, limit: 100 });
  const allSeries = seriesList.data?.data.results ?? [];

  // Newest first, by id rather than by date: `created_time` is rewritten by
  // re-imports, which floats decade-old material to the top of what should be
  // "what we did lately". Ids only ever ascend.
  const { data, isPending } = useVideosList({
    organization: organizationId,
    ordering: "-id",
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    ...(visibility === "all" ? {} : { publish_on_web: visibility === "public" }),
    ...(series ? { series } : {}),
    ...(query ? { q: query } : {}),
  });
  const videos = data?.data.results ?? [];
  const count = data?.data.count ?? 0;
  const lastPage = Math.max(0, Math.ceil(count / PAGE_SIZE) - 1);
  const narrowed = visibility !== "all" || !!series || !!query;

  return (
    <section aria-labelledby="org-videos-heading" className="space-y-4">
      <h2 id="org-videos-heading" className="sr-only">
        Ferdige videoer
      </h2>

      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Synlighet" className="flex flex-wrap gap-2">
          {VISIBILITY.map(({ key, label }) => (
            <button
              aria-pressed={visibility === key}
              className={cx(
                "rounded-full border px-3 py-1 text-sm outline-focus focus-visible:outline-2",
                visibility === key
                  ? "border-foreground bg-foreground text-background"
                  : "border-default-300 text-default-700 hover:border-default-500",
              )}
              key={key}
              onClick={() => {
                setVisibility(key);
                setPage(0);
              }}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        {allSeries.length > 0 && (
          <label className="flex items-center gap-2 text-sm text-default-700">
            <span className="sr-only">Serie</span>
            <select
              className="rounded-full border border-default-300 bg-background px-3 py-1"
              onChange={(event) => {
                setSeries(Number(event.target.value) || undefined);
                setPage(0);
              }}
              value={series ?? ""}
            >
              <option value="">Alle serier</option>
              {allSeries.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="ms-auto w-full sm:w-64">
          <span className="sr-only">Søk i videoene</span>
          <input
            className="w-full rounded-md border border-default-300 bg-background px-3 py-1.5"
            onChange={(event) => setTyped(event.target.value)}
            placeholder="Søk i videoene"
            type="search"
            value={typed}
          />
        </label>
      </div>

      {videos.length ? (
        <VideoList
          videos={videos}
          showOrganization={false}
          href={(video) => `/video/${video.id}/edit`}
          status={(video) =>
            video.publishOnWeb === false ? (
              <span className="rounded bg-default-200 px-2 py-0.5 text-xs font-semibold text-default-700">
                Skjult
              </span>
            ) : null
          }
          actions={(video) => (
            <VideoRowMenu
              video={video}
              isDeleting={isRemoving(video.id)}
              onDelete={() =>
                remove(
                  video.id,
                  video.name,
                  `Slett videoen «${video.name}»? Dette kan ikke angres.`,
                )
              }
            />
          )}
        />
      ) : isPending ? null : (
        <p className="text-foreground/75">
          {narrowed ? "Ingen videoer passer." : "Dere har ingen ferdige videoer ennå."}
        </p>
      )}

      {count > PAGE_SIZE && (
        <nav
          aria-label="Sider"
          className="flex items-center justify-between gap-4 text-sm text-default-700"
        >
          <span>Viser {rangeText(page * PAGE_SIZE, videos.length, count)}</span>
          <span className="flex gap-2">
            <button
              className="rounded-md px-3 py-1.5 font-semibold text-link hover:bg-default-100 disabled:text-default-400"
              disabled={page === 0}
              onClick={() => setPage((current) => current - 1)}
              type="button"
            >
              ← Forrige
            </button>
            <button
              className="rounded-md px-3 py-1.5 font-semibold text-link hover:bg-default-100 disabled:text-default-400"
              disabled={page >= lastPage}
              onClick={() => setPage((current) => current + 1)}
              type="button"
            >
              Neste →
            </button>
          </span>
        </nav>
      )}

      {error && (
        <p role="alert" className="text-danger-700 text-sm">
          Videoen kunne ikke slettes: {error}
        </p>
      )}
    </section>
  );
};
