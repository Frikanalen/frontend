"use client";
import { FormInput } from "@/components/FormField";
import type { IssuedEncoderKey, LiveSource } from "@/generated/frikanalenDjangoAPI.schemas";
import {
  getLiveSourcesEncoderKeysListQueryKey,
  useLiveSourcesEncoderKeysCreate,
  useLiveSourcesEncoderKeysDestroy,
  useLiveSourcesEncoderKeysList,
  useLiveSourcesEncoderKeysReplace,
} from "@/generated/live-sources/live-sources";
import { formatApiError } from "@/lib/formatApiError";
import { removeEncoderQuestion, replaceKeyQuestion } from "@/lib/live/source";
import { formatOsloTime, inOsloTime } from "@/lib/osloTime";
import { Button } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { nb } from "date-fns/locale/nb";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { bookingDay } from "./BookingStatus";
import { EncoderSettings } from "./EncoderSettings";

const when = (time: string) =>
  `${format(inOsloTime(time), "d. MMM yyyy", { locale: nb })} kl. ${formatOsloTime(time)}`;

/** The one look at a key: its settings, ready to paste into the encoder. */
const IssuedKey = ({ issued, onDone }: { issued: IssuedEncoderKey; onDone: () => void }) => (
  <div
    aria-label={`Innstillinger for «${issued.label}»`}
    className="space-y-3 border border-default-300 bg-background p-4"
    role="region"
  >
    <EncoderSettings issued={issued} />
    <Button size="sm" onPress={onDone}>
      Jeg har kopiert det
    </Button>
  </div>
);

/**
 * The encoders that may send to a source. Each has a key of its own, so
 * one can be removed or given a new key without touching the others. A
 * key's settings are shown once, when it is made; "Bytt nøkkel" is the
 * way back to them. Those who can't set up live transmission see the list
 * only.
 */
export const EncoderKeys = ({
  source,
  maySetUp,
  receiving,
}: {
  source: LiveSource;
  maySetUp: boolean;
  /** A signal is coming in on the source right now. */
  receiving: boolean;
}) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const queryKey = getLiveSourcesEncoderKeysListQueryKey(source.id);
  const keys = useLiveSourcesEncoderKeysList(source.id);
  const create = useLiveSourcesEncoderKeysCreate();
  const replace = useLiveSourcesEncoderKeysReplace();
  const revoke = useLiveSourcesEncoderKeysDestroy();
  const [label, setLabel] = useState("");
  const [issued, setIssued] = useState<IssuedEncoderKey>();
  const listed = keys.data?.data ?? [];
  const busy = create.isPending || replace.isPending || revoke.isPending;

  // The source's own status counts its encoders, so it is asked anew too.
  const changed = async () => {
    await queryClient.invalidateQueries({ queryKey });
    router.refresh();
  };

  const add = async () => {
    const response = await create.mutateAsync({ id: source.id, data: { label: label.trim() } });
    setIssued(response.data);
    setLabel("");
    await changed();
  };

  const giveNewKey = async (key: { id: number; label: string }) => {
    if (!globalThis.confirm(replaceKeyQuestion(key.label))) return;
    const response = await replace.mutateAsync({ id: source.id, keyPk: key.id });
    setIssued(response.data);
    await changed();
  };

  const remove = async (key: { id: number; label: string }) => {
    const [next] = source.upcomingTransmissions;
    const question = removeEncoderQuestion({
      label: key.label,
      last: listed.length === 1,
      receiving,
      booking: next
        ? `«${next.name}», ${bookingDay(next)} kl. ${formatOsloTime(next.starttime)}`
        : undefined,
    });
    if (!globalThis.confirm(question)) return;
    await revoke.mutateAsync({ id: source.id, keyPk: key.id });
    if (issued?.id === key.id) setIssued(undefined);
    await changed();
  };

  const error = create.error ?? replace.error ?? revoke.error;

  return (
    <section className="space-y-3">
      <h3 className="font-semibold">Kodere som kan sende hit</h3>
      <p className="max-w-2xl text-sm text-default-600">
        Hver koder får sin egen nøkkel. Da kan én fjernes eller få ny nøkkel uten at de andre må
        stilles inn på nytt.
      </p>
      {issued ? <IssuedKey issued={issued} onDone={() => setIssued(undefined)} /> : null}
      {keys.isLoading ? <p>Laster kodere…</p> : null}
      {keys.data && listed.length === 0 ? (
        <p className="border-l-4 border-warning bg-content1 p-3 text-sm" role="status">
          Ingen koder er koblet til, så kilden kan ikke ta imot signal.
          {maySetUp && source.enabled ? " Legg til en koder under." : ""}
        </p>
      ) : null}
      <ul>
        {listed.map((key) => (
          <li
            className="flex flex-wrap items-center gap-2 border-b border-default-200 py-2"
            key={key.id}
          >
            <span className="min-w-0 grow basis-48">
              <span className="block truncate font-medium">{key.label}</span>
              <span className="block text-xs text-default-600">
                Koblet til {when(key.createdAt)} ·{" "}
                {key.lastUsedAt ? `sendte sist ${when(key.lastUsedAt)}` : "har ikke sendt ennå"}
              </span>
            </span>
            {maySetUp ? (
              <span className="flex gap-2">
                {source.enabled ? (
                  <Button
                    aria-label={`Bytt nøkkel for «${key.label}»`}
                    isDisabled={busy}
                    size="sm"
                    variant="tertiary"
                    onPress={() => void giveNewKey(key).catch(() => undefined)}
                  >
                    Bytt nøkkel
                  </Button>
                ) : null}
                <Button
                  aria-label={`Fjern «${key.label}»`}
                  isDisabled={busy}
                  size="sm"
                  variant="danger-soft"
                  onPress={() => void remove(key).catch(() => undefined)}
                >
                  Fjern
                </Button>
              </span>
            ) : null}
          </li>
        ))}
      </ul>
      {maySetUp && source.enabled ? (
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void add().catch(() => undefined);
          }}
        >
          <div className="min-w-48 grow">
            <FormInput
              description="Hva dere kaller koderen, f.eks. «ATEM i studio»."
              label="Legg til en koder"
              value={label}
              onValueChange={setLabel}
            />
          </div>
          <Button isDisabled={!label.trim() || busy} type="submit">
            Legg til
          </Button>
        </form>
      ) : null}
      {error ? <p role="alert">{formatApiError(error)}</p> : null}
    </section>
  );
};
