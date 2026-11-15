"use client";
import { SCREEN_TEMPLATES } from "@/components/screen-text/ScreenTextEditor";
import type { Bulletin } from "@/generated/frikanalenDjangoAPI.schemas";
import { useNewsBulletinsList } from "@/generated/news/news";
import { formatApiError } from "@/lib/formatApiError";
import { Button } from "@heroui/react";
import cx from "classnames";
import { useEffect, useState } from "react";
import { GoNote } from "react-icons/go";
import { BulletinEditor } from "./BulletinEditor";
import { placesText, statusOf, statusText, type BulletinStatus } from "./bulletins";

const GROUPS: { status: BulletinStatus; title: string; empty?: string }[] = [
  {
    status: "showing",
    title: "Vises nå",
    empty: "Ingen meldinger vises nå. Pausene mellom programmene viser bare sendeplanen.",
  },
  { status: "waiting", title: "Kommer" },
  { status: "draft", title: "Utkast" },
  { status: "over", title: "Ferdige" },
];

const Row = ({
  bulletin,
  now,
  onEdit,
}: {
  bulletin: Bulletin;
  now: number;
  onEdit: () => void;
}) => (
  <li className="flex items-center gap-3 border-b border-default-200 py-3">
    <span
      aria-hidden
      className={cx(
        "h-6 w-10 shrink-0 rounded-sm border border-default-300 bg-[#f5efe4]",
        bulletin.template === "notice" && "border-l-4 border-l-[#faaa3f]",
      )}
    />
    <div className="min-w-0 grow">
      <div className="truncate font-semibold">{bulletin.heading}</div>
      <div className="text-sm text-default-600">
        {statusText(bulletin, now)} · {placesText(bulletin)} ·{" "}
        {bulletin.pages.length === 1 ? "én side" : `${bulletin.pages.length} sider`},{" "}
        {bulletin.readingSeconds} s
        {bulletin.template === "notice" ? ` · ${SCREEN_TEMPLATES.notice.toLowerCase()}` : ""}
      </div>
    </div>
    <Button size="sm" variant="tertiary" onPress={onEdit}>
      Endre
    </Button>
  </li>
);

/** Every bulletin, by where it is in its life, and the way to write one. */
export const BulletinsBoard = () => {
  const bulletins = useNewsBulletinsList({ limit: 100 });
  const results = bulletins.data?.data.results ?? [];
  const [editing, setEditing] = useState<Bulletin | null>(null);
  const [open, setOpen] = useState(false);
  // A clock of the page's own, so a bulletin moves group when its time comes.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6">
      <Button
        onPress={() => {
          setEditing(null);
          setOpen(true);
        }}
      >
        <GoNote aria-hidden />
        Ny melding
      </Button>
      <BulletinEditor
        editing={editing}
        isOpen={open}
        key={open ? (editing?.id ?? "new") : "closed"}
        onClose={() => setOpen(false)}
      />
      {bulletins.isError ? <p role="alert">{formatApiError(bulletins.error)}</p> : null}
      {bulletins.isLoading
        ? null
        : GROUPS.map(({ status, title, empty }) => {
            const group = results.filter((bulletin) => statusOf(bulletin, now) === status);
            if (!group.length && !empty) return null;
            return (
              <section aria-label={title} className="max-w-3xl" key={status}>
                <h2 className="border-b border-default-300 pb-1 text-xl font-bold">{title}</h2>
                {group.length ? (
                  <ul>
                    {group.map((bulletin) => (
                      <Row
                        bulletin={bulletin}
                        key={bulletin.id}
                        now={now}
                        onEdit={() => {
                          setEditing(bulletin);
                          setOpen(true);
                        }}
                      />
                    ))}
                  </ul>
                ) : (
                  <p className="py-3 text-sm text-default-600">{empty}</p>
                )}
              </section>
            );
          })}
    </div>
  );
};
