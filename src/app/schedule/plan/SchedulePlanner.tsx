"use client";

import type {
  Organization,
  ScheduleitemRead,
  SchedulingPolicy,
  Video,
} from "@/generated/frikanalenDjangoAPI.schemas";
import { useCsrfRetrieve } from "@/generated/csrf/csrf";
import {
  useScheduleitemsCreate,
  useScheduleitemsDestroy,
  useScheduleitemsList,
  useScheduleitemsPartialUpdate,
} from "@/generated/scheduleitems/scheduleitems";
import { useVideosList } from "@/generated/videos/videos";
import { formatApiError } from "@/lib/formatApiError";
import { formatOsloTime, inOsloTime } from "@/lib/osloTime";
import { Button, Input } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { nb } from "date-fns/locale/nb";
import { FormEvent, useMemo, useState } from "react";
import { DURATION_PATTERN } from "./duration";
import { openDates, osloDateTime, plannerRows } from "./plannerRows";

type PickedVideo = Pick<Video, "id" | "name" | "duration">;

type Draft = {
  itemId?: number;
  video?: PickedVideo;
  time: string;
  duration: string;
};

const emptyDraft = (): Draft => ({ time: "12:00", duration: "00:30:00" });

const durationBetween = (start: Date, end: Date) => {
  const seconds = Math.floor((end.getTime() - start.getTime()) / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return [hours, minutes, remainder].map((part) => String(part).padStart(2, "0")).join(":");
};

const statusText = (item: ScheduleitemRead, manageableOrganizationIds: Set<number>) => {
  if (item.displaceable) return "Ledig jukeboksflate";
  if (item.video && manageableOrganizationIds.has(item.video.organization.id)) {
    return "Deres sending";
  }
  return "Fastlagt sending";
};

export const SchedulePlanner = ({
  organizations,
  policy,
  initialOrganizationId,
  isStaff,
  showOrganizationSelector = false,
}: {
  organizations: Organization[];
  policy: SchedulingPolicy;
  initialOrganizationId?: number;
  isStaff: boolean;
  showOrganizationSelector?: boolean;
}) => {
  const dates = useMemo(
    () => openDates(policy.freezeBoundary, policy.schedulingHorizon),
    [policy.freezeBoundary, policy.schedulingHorizon],
  );
  const initialOrganization = organizations.some(({ id }) => id === initialOrganizationId)
    ? initialOrganizationId
    : organizations[0]?.id;
  const [organizationId, setOrganizationId] = useState(initialOrganization);
  const [date, setDate] = useState(dates[0] ?? "");
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string>();
  const queryClient = useQueryClient();
  const csrf = useCsrfRetrieve({
    request: { withCredentials: true, headers: { "Cache-Control": "no-store" } },
  });
  const manageableOrganizationIds = useMemo(
    () => new Set(organizations.map(({ id }) => id)),
    [organizations],
  );

  const schedule = useScheduleitemsList(
    { date, days: 1, limit: 1000, ordering: "starttime", surrounding: true },
    { query: { enabled: Boolean(date) } },
  );
  const videos = useVideosList(
    {
      organization: organizationId,
      q: search || undefined,
      ordering: "-created_time",
      limit: 50,
    },
    { query: { enabled: organizationId !== undefined } },
  );
  const create = useScheduleitemsCreate();
  const update = useScheduleitemsPartialUpdate();
  const destroy = useScheduleitemsDestroy();

  const items = useMemo(() => schedule.data?.data.results ?? [], [schedule.data]);
  const rows = useMemo(() => plannerRows(items, policy.weeklySlots, date), [items, policy, date]);
  const isSaving = create.isPending || update.isPending || destroy.isPending;

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["/api/scheduleitems"] });
  };

  const pickSlot = (start: Date, end: Date, item?: ScheduleitemRead) => {
    setError(undefined);
    setDraft({
      itemId: item && !item.displaceable ? item.id : undefined,
      video: item?.video
        ? { id: item.video.id, name: item.video.name, duration: item.duration }
        : draft.video,
      time: format(inOsloTime(start), "HH:mm"),
      duration: item?.duration ?? draft.video?.duration ?? durationBetween(start, end),
    });
  };

  const pickVideo = (video: Video) => {
    setDraft((current) => ({
      ...current,
      video: { id: video.id, name: video.name, duration: video.duration },
      duration: video.duration || current.duration,
    }));
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setError(undefined);
    if (!csrf.isSuccess) {
      setError("Sikkerhetstokenet er ikke klart. Last siden på nytt og prøv igjen.");
      return;
    }
    if (!draft.video) {
      setError("Velg en video før du lagrer.");
      return;
    }

    const data = {
      video: draft.video.id,
      starttime: osloDateTime(date, draft.time).toISOString(),
      duration: draft.duration,
    };

    try {
      if (draft.itemId !== undefined) {
        await update.mutateAsync({ id: draft.itemId, data });
      } else {
        await create.mutateAsync({ data });
      }
      setDraft(emptyDraft());
      await refresh();
    } catch (caught) {
      setError(formatApiError(caught));
    }
  };

  const remove = async (item: ScheduleitemRead) => {
    if (!window.confirm(`Fjern «${item.video?.name || item.defaultName}» fra sendeplanen?`)) return;
    setError(undefined);
    try {
      await destroy.mutateAsync({ id: item.id });
      if (draft.itemId === item.id) setDraft(emptyDraft());
      await refresh();
    } catch (caught) {
      setError(formatApiError(caught));
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(20rem,2fr)]">
      <section className="space-y-4">
        <div className={`grid gap-3 ${showOrganizationSelector ? "sm:grid-cols-2" : ""}`}>
          {showOrganizationSelector ? (
            <label className="flex flex-col gap-1 font-medium">
              Organisasjon
              <select
                className="rounded-lg border border-default-300 bg-background px-3 py-2"
                value={organizationId}
                onChange={(event) => {
                  setOrganizationId(Number(event.target.value));
                  setDraft(emptyDraft());
                }}
              >
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="flex flex-col gap-1 font-medium">
            Sendedag
            <select
              className="rounded-lg border border-default-300 bg-background px-3 py-2"
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                setDraft(emptyDraft());
              }}
            >
              {dates.map((openDate) => (
                <option key={openDate} value={openDate}>
                  {format(osloDateTime(openDate, "12:00"), "EEEE d. MMMM", { locale: nb })}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="rounded-xl border border-default-200 bg-content1 p-3 shadow-sm">
          <h2 className="mb-3 text-xl font-semibold">Sendeplan</h2>
          {schedule.isLoading ? <p>Laster sendeplan…</p> : null}
          {schedule.isError ? <p role="alert">{formatApiError(schedule.error)}</p> : null}
          <ol className="space-y-2">
            {rows.map((row, index) => {
              if (row.kind === "gap") {
                return (
                  <li
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-success-400 bg-success-50 p-3 dark:bg-success-950"
                    key={`gap-${row.start.toISOString()}`}
                  >
                    <span>
                      <strong>{formatOsloTime(row.start)}</strong>–{formatOsloTime(row.end)} Ledig
                    </span>
                    <Button size="sm" onPress={() => pickSlot(row.start, row.end)}>
                      Legg inn program
                    </Button>
                  </li>
                );
              }

              if (row.kind === "weeklySlot") {
                return (
                  <li
                    className="rounded-lg border border-dashed border-secondary-300 bg-secondary-50 p-3 dark:bg-secondary-950"
                    key={`weekly-slot-${row.slot.id}-${row.start.toISOString()}`}
                  >
                    <div className="font-semibold">
                      {formatOsloTime(row.start)}–{formatOsloTime(row.end)} Ukentlig sendeflate
                    </div>
                    <div className="text-sm text-default-600">
                      {row.slot.purpose?.name ?? "Program velges automatisk"}
                    </div>
                  </li>
                );
              }

              const item = row.item;
              const canManage =
                isStaff ||
                Boolean(item.video && manageableOrganizationIds.has(item.video.organization.id));
              return (
                <li
                  className={`rounded-lg border p-3 ${
                    item.displaceable
                      ? "border-dashed border-warning-400 bg-warning-50 dark:bg-warning-950"
                      : "border-default-200"
                  }`}
                  key={`item-${item.id}-${index}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold">
                        {formatOsloTime(item.starttime)}–{formatOsloTime(item.endtime)}{" "}
                        {item.video?.name || item.defaultName || "Uten programnavn"}
                      </div>
                      <div className="text-sm text-default-600">
                        {item.weeklySlot
                          ? "Ukentlig sendeflate"
                          : statusText(item, manageableOrganizationIds)}
                        {item.video ? ` · ${item.video.organization.name}` : ""}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {item.displaceable ? (
                        <Button
                          color="primary"
                          size="sm"
                          onPress={() =>
                            pickSlot(new Date(item.starttime), new Date(item.endtime), item)
                          }
                        >
                          Erstatt
                        </Button>
                      ) : null}
                      {canManage && item.video && !item.displaceable ? (
                        <Button
                          size="sm"
                          onPress={() =>
                            pickSlot(new Date(item.starttime), new Date(item.endtime), item)
                          }
                        >
                          Endre
                        </Button>
                      ) : null}
                      {canManage && !item.displaceable ? (
                        <Button
                          color="danger"
                          size="sm"
                          variant="light"
                          onPress={() => remove(item)}
                        >
                          Fjern
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <aside className="space-y-4">
        <form
          className="space-y-3 rounded-xl border border-default-200 bg-content1 p-4"
          onSubmit={save}
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl font-semibold">
              {draft.itemId === undefined ? "Legg inn program" : "Endre program"}
            </h2>
            {draft.itemId !== undefined ? (
              <Button size="sm" variant="light" onPress={() => setDraft(emptyDraft())}>
                Avbryt
              </Button>
            ) : null}
          </div>
          <p className="text-sm text-default-600">
            Video: {draft.video?.name ?? "Ingen video valgt"}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Input
              isRequired
              label="Starttid"
              type="time"
              value={draft.time}
              onValueChange={(time) => setDraft((current) => ({ ...current, time }))}
            />
            <Input
              isRequired
              label="Varighet"
              description="TT:MM:SS, eventuelt med desimaler"
              pattern={DURATION_PATTERN}
              value={draft.duration}
              onValueChange={(duration) => setDraft((current) => ({ ...current, duration }))}
            />
          </div>
          {error ? (
            <p className="rounded-lg bg-danger-50 p-3 text-danger-700" role="alert">
              {error}
            </p>
          ) : null}
          <Button
            color="primary"
            isDisabled={!draft.video || !csrf.isSuccess}
            isLoading={isSaving}
            type="submit"
          >
            Lagre i sendeplanen
          </Button>
          {csrf.isError ? (
            <p className="text-sm text-danger-700" role="alert">
              Klarte ikke å hente sikkerhetstoken. Last siden på nytt.
            </p>
          ) : null}
        </form>

        <section className="space-y-3 rounded-xl border border-default-200 bg-content1 p-4">
          <h2 className="text-xl font-semibold">Velg video</h2>
          <Input
            label="Søk i organisasjonens videoer"
            type="search"
            value={search}
            onValueChange={setSearch}
          />
          {videos.isLoading ? <p>Laster videoer…</p> : null}
          {videos.isError ? <p role="alert">{formatApiError(videos.error)}</p> : null}
          <ul className="max-h-[32rem] space-y-2 overflow-y-auto">
            {(videos.data?.data.results ?? []).map((video) => (
              <li
                className="flex items-center justify-between gap-2 border-b border-default-100 py-2"
                key={video.id}
              >
                <div>
                  <div className="font-medium">{video.name}</div>
                  <div className="text-sm text-default-500">
                    {video.duration || "Ukjent varighet"}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={draft.video?.id === video.id ? "solid" : "flat"}
                  onPress={() => pickVideo(video)}
                >
                  Velg
                </Button>
              </li>
            ))}
          </ul>
          {!videos.isLoading && videos.data?.data.results.length === 0 ? (
            <p>Ingen ferdigbehandlede videoer funnet.</p>
          ) : null}
        </section>
      </aside>
    </div>
  );
};
