"use client";
import { FormInput } from "@/components/FormField";
import type { LiveSource } from "@/generated/frikanalenDjangoAPI.schemas";
import { useLiveSourcesPartialUpdate } from "@/generated/live-sources/live-sources";
import { formatApiError } from "@/lib/formatApiError";
import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const PULL_URL_HELP =
  "srt://, rtmp://, rtmps://, rtsp:// eller https://…/index.m3u8 (HLS). Ta med passord, " +
  "strømnøkkel eller passphrase i adressen; den vises ikke igjen.";

/**
 * A pulled source's address: Frikanalen fetches the signal from it whenever
 * someone watches the source, so there are no encoder keys. The address is
 * a secret and only its host is shown; it can be replaced, not read back.
 */
export const PullAddress = ({ source, maySetUp }: { source: LiveSource; maySetUp: boolean }) => {
  const router = useRouter();
  const update = useLiveSourcesPartialUpdate();
  const [pullUrl, setPullUrl] = useState("");

  const save = async (data: { pullUrl?: string; enabled?: boolean }) => {
    await update.mutateAsync({ id: source.id, data });
    setPullUrl("");
    router.refresh();
  };

  return (
    <section className="space-y-3 border-t border-default-200 pt-4 md:col-span-2">
      <h3 className="font-semibold">Henteadresse</h3>
      <p className="text-sm text-default-600">
        Frikanalen henter signalet fra <code>{source.pullTarget}</code> når noen ser på kilden: når
        du starter forhåndsvisningen, og like før en direktesending. Start forhåndsvisningen for å
        teste at adressen virker.
      </p>
      {maySetUp ? (
        <form
          aria-label="Bytt henteadresse"
          className="flex flex-wrap items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void save({ pullUrl: pullUrl.trim() }).catch(() => undefined);
          }}
        >
          <div className="min-w-64 grow">
            <FormInput
              description={PULL_URL_HELP}
              label="Ny adresse"
              value={pullUrl}
              onValueChange={setPullUrl}
            />
          </div>
          <Button isDisabled={!pullUrl.trim() || update.isPending} type="submit">
            Bytt adresse
          </Button>
        </form>
      ) : null}
      {maySetUp ? (
        <div className="flex flex-wrap gap-2">
          <Button
            isDisabled={update.isPending}
            size="sm"
            variant="tertiary"
            onPress={() => {
              // The address can't be read back, so losing it by a slip is costly.
              if (
                globalThis.confirm(
                  "Slutte å hente fra adressen? Den slettes og kan ikke vises igjen. Kilden venter da på signal fra en koder.",
                )
              ) {
                void save({ pullUrl: "" }).catch(() => undefined);
              }
            }}
          >
            Send fra koder i stedet
          </Button>
          <Button
            isDisabled={update.isPending}
            size="sm"
            variant="tertiary"
            onPress={() => void save({ enabled: !source.enabled }).catch(() => undefined)}
          >
            {source.enabled ? "Slå av kilden" : "Slå på kilden"}
          </Button>
        </div>
      ) : null}
      {maySetUp ? (
        <p className="text-xs text-default-600">
          En kilde som er slått av, tar ikke imot signal og kan ikke settes i sendeplanen.
        </p>
      ) : null}
      {update.error ? <p role="alert">{formatApiError(update.error)}</p> : null}
    </section>
  );
};
