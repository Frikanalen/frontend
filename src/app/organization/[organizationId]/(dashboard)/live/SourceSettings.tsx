"use client";
import { FormInput } from "@/components/FormField";
import type { LiveSource } from "@/generated/frikanalenDjangoAPI.schemas";
import {
  useLiveSourcesDestroy,
  useLiveSourcesPartialUpdate,
} from "@/generated/live-sources/live-sources";
import { formatApiError } from "@/lib/formatApiError";
import { formatOsloTime } from "@/lib/osloTime";
import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { bookingDay } from "./BookingStatus";

/**
 * A source's setup, in the order of its life: what it is called, how the
 * signal gets to it (`children`: its encoders, or the address we fetch
 * from), and how it ends. A source a programme has used is part of the
 * schedule's history and can only be switched off; one that never was
 * used can be deleted. Neither while a broadcast is coming, and the page
 * says so rather than offering a button that will be refused.
 */
export const SourceSettings = ({
  source,
  maySetUp,
  children,
}: {
  source: LiveSource;
  maySetUp: boolean;
  children: ReactNode;
}) => {
  const router = useRouter();
  const update = useLiveSourcesPartialUpdate();
  const destroy = useLiveSourcesDestroy();
  const [name, setName] = useState(source.name);
  const enabled = source.enabled !== false;
  const [booking] = source.upcomingTransmissions;
  const busy = update.isPending || destroy.isPending;

  const save = async (data: { name?: string; enabled?: boolean }) => {
    await update.mutateAsync({ id: source.id, data });
    router.refresh();
  };

  const remove = async () => {
    const question = `Slette «${source.name}»? Kilden og koderne som er koblet til den, fjernes for godt.`;
    if (!globalThis.confirm(question)) return;
    await destroy.mutateAsync({ id: source.id });
    router.refresh();
  };

  const error = update.error ?? destroy.error;

  return (
    <div className="space-y-6">
      {maySetUp ? (
        <form
          aria-label="Navn på kilden"
          className="flex max-w-xl flex-wrap items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void save({ name: name.trim() }).catch(() => undefined);
          }}
        >
          <div className="min-w-48 grow">
            <FormInput label="Navn" value={name} onValueChange={setName} />
          </div>
          <Button
            isDisabled={!name.trim() || name.trim() === source.name || busy}
            type="submit"
            variant="secondary"
          >
            Lagre navn
          </Button>
        </form>
      ) : null}

      {children}

      {maySetUp ? (
        <section className="space-y-2 border-t border-default-200 pt-4">
          <h3 className="font-semibold">{enabled ? "Slå av eller slett" : "Slå på eller slett"}</h3>
          {booking && enabled ? (
            <p className="max-w-2xl text-sm">
              Kilden skal på lufta {bookingDay(booking)} kl. {formatOsloTime(booking.starttime)} («
              {booking.name}»), og kan ikke slås av eller slettes før sendingen er flyttet eller
              fjernet fra sendeplanen.
            </p>
          ) : (
            <>
              <p className="max-w-2xl text-sm text-default-600">
                {enabled
                  ? "En kilde som er slått av, tar ikke imot signal og kan ikke settes i sendeplanen. Koderne beholder nøklene sine, og kilden kan slås på igjen."
                  : "Kilden er slått av og tar ikke imot signal."}{" "}
                {source.canDelete
                  ? "Kilden har aldri vært brukt i et program, så den kan også slettes helt."
                  : "Kilden er brukt i et program og kan derfor ikke slettes, bare slås av."}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  isDisabled={busy}
                  size="sm"
                  variant={enabled ? "tertiary" : "secondary"}
                  onPress={() => void save({ enabled: !enabled }).catch(() => undefined)}
                >
                  {enabled ? "Slå av kilden" : "Slå på kilden"}
                </Button>
                {source.canDelete ? (
                  <Button
                    isDisabled={busy}
                    size="sm"
                    variant="danger-soft"
                    onPress={() => void remove().catch(() => undefined)}
                  >
                    Slett kilden
                  </Button>
                ) : null}
              </div>
            </>
          )}
        </section>
      ) : null}
      {error ? <p role="alert">{formatApiError(error)}</p> : null}
    </div>
  );
};
