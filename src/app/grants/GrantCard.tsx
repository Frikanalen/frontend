"use client";
import type { AirtimeGrant } from "@/generated/frikanalenDjangoAPI.schemas";
import { useGrantsAutomaticCreate, useGrantsItemsUpdate } from "@/generated/grants/grants";
import { formatApiError } from "@/lib/formatApiError";
import { formatOsloTime, inOsloTime } from "@/lib/osloTime";
import { Button } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { nb } from "date-fns/locale/nb";
import { useState } from "react";
import { durationMilliseconds, formatDuration } from "./duration";
import { FillBar } from "./FillBar";
import {
  deadlineText,
  type DraftItem,
  isAutomatic,
  itemKey,
  itemName,
  itemsPayload,
  listMilliseconds,
  moveItem,
  STATE_LABELS,
  windowMilliseconds,
} from "./grants";
import { VideoPicker } from "./VideoPicker";

const osloDateTime = (instant: string) =>
  format(inOsloTime(instant), "EEEE d. MMMM 'kl.' HH:mm", { locale: nb });

const ItemLine = ({ item }: { item: DraftItem }) => {
  const length = item.video?.duration ? durationMilliseconds(item.video.duration) : undefined;
  return (
    <span className="min-w-0">
      <span className="font-medium">{itemName(item)}</span>
      <span className="text-sm text-default-500">
        {" · "}
        {item.liveTransmission ? "Direkte" : length ? formatDuration(length) : "Ukjent lengde"}
        {item.video?.pendingUpload ? " · venter på fil" : ""}
      </span>
    </span>
  );
};

export const GrantCard = ({
  grant,
  showOrganization = false,
}: {
  grant: AirtimeGrant;
  showOrganization?: boolean;
}) => {
  const [draft, setDraft] = useState<DraftItem[]>();
  const [error, setError] = useState<string>();
  const queryClient = useQueryClient();
  const saveItems = useGrantsItemsUpdate();
  const automatic = useGrantsAutomaticCreate();
  const windowLength = windowMilliseconds(grant);
  const editing = draft !== undefined;
  const shown = draft ?? grant.items;

  const done = async () => {
    setDraft(undefined);
    setError(undefined);
    await queryClient.invalidateQueries({ queryKey: ["/api/grants"] });
  };

  const save = async () => {
    if (!draft) return;
    setError(undefined);
    try {
      await saveItems.mutateAsync({ id: grant.id, data: { items: itemsPayload(draft) } });
      await done();
    } catch (caught) {
      setError(formatApiError(caught));
    }
  };

  const backToAutomatic = async () => {
    if (!globalThis.confirm("Erstatte listen med et automatisk utvalg?")) return;
    setError(undefined);
    try {
      await automatic.mutateAsync({ id: grant.id });
      await done();
    } catch (caught) {
      setError(formatApiError(caught));
    }
  };

  return (
    <article
      className={`space-y-3 rounded-xl border bg-content1 p-4 ${
        grant.state === "cancelled" ? "border-default-200 opacity-60" : "border-default-200"
      }`}
    >
      <header className="flex flex-wrap items-start gap-2">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold first-letter:uppercase">
            {format(inOsloTime(grant.starttime), "EEEE d. MMMM", { locale: nb })}{" "}
            {formatOsloTime(grant.starttime)}–{formatOsloTime(grant.endtime)}
          </h3>
          {showOrganization ? (
            <p className="text-sm text-default-600">{grant.organization.name}</p>
          ) : null}
        </div>
        <div className="ms-auto flex flex-wrap gap-1 text-xs">
          <span className="rounded-full bg-default-100 px-2 py-1">{STATE_LABELS[grant.state]}</span>
          {isAutomatic(grant) ? (
            <span className="rounded-full bg-primary-100 px-2 py-1 text-primary-800">
              Automatisk
            </span>
          ) : null}
          {grant.lockExempt ? (
            <span className="rounded-full bg-warning-100 px-2 py-1 text-warning-800">
              Unntatt fra låsing
            </span>
          ) : null}
        </div>
      </header>

      <p className="text-sm text-default-600">
        {deadlineText(grant, osloDateTime(grant.locksAt))}
        {isAutomatic(grant) && !editing
          ? " Listen fylles automatisk hver natt til den låses. Endrer dere den, slutter den å fylles automatisk."
          : ""}
      </p>

      <FillBar used={listMilliseconds(shown)} window={windowLength} />

      {shown.length === 0 ? (
        <p className="text-sm">Ingenting er satt opp. Tom sendetid viser grafikk.</p>
      ) : (
        <ol className="space-y-1">
          {shown.map((item, index) => (
            <li className="flex items-center gap-2" key={`${itemKey(item)}-${index}`}>
              <span className="w-6 text-end text-sm text-default-500">{index + 1}.</span>
              <ItemLine item={item} />
              {editing ? (
                <span className="ms-auto flex gap-1">
                  <Button
                    aria-label={`Flytt «${itemName(item)}» opp`}
                    isDisabled={index === 0}
                    size="sm"
                    variant="tertiary"
                    onPress={() => setDraft(moveItem(shown, index, index - 1))}
                  >
                    ↑
                  </Button>
                  <Button
                    aria-label={`Flytt «${itemName(item)}» ned`}
                    isDisabled={index === shown.length - 1}
                    size="sm"
                    variant="tertiary"
                    onPress={() => setDraft(moveItem(shown, index, index + 1))}
                  >
                    ↓
                  </Button>
                  <Button
                    aria-label={`Fjern «${itemName(item)}»`}
                    size="sm"
                    variant="tertiary"
                    onPress={() => setDraft(shown.filter((_, other) => other !== index))}
                  >
                    Fjern
                  </Button>
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      )}

      {error ? (
        <p className="rounded-lg bg-danger-50 p-3 text-danger-700" role="alert">
          {error}
        </p>
      ) : null}

      {grant.canEdit ? (
        editing ? (
          <div className="space-y-4 border-t border-default-200 pt-3">
            <VideoPicker
              organizationId={grant.organization.id}
              onPick={(video) => setDraft([...shown, { video, liveTransmission: null }])}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                isDisabled={listMilliseconds(shown) > windowLength}
                isPending={saveItems.isPending}
                variant="primary"
                onPress={save}
              >
                Lagre listen
              </Button>
              <Button variant="tertiary" onPress={() => done()}>
                Avbryt
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onPress={() => setDraft([...grant.items])}>
              Endre listen
            </Button>
            {!isAutomatic(grant) && grant.originSlot !== null ? (
              <Button
                isPending={automatic.isPending}
                size="sm"
                variant="tertiary"
                onPress={backToAutomatic}
              >
                Fyll automatisk igjen
              </Button>
            ) : null}
          </div>
        )
      ) : null}
    </article>
  );
};
