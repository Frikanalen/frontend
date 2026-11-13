"use client";
import { FormInput } from "@/components/FormField";
import type { IssuedEncoderKey, LiveSource } from "@/generated/frikanalenDjangoAPI.schemas";
import {
  getLiveSourcesEncoderKeysListQueryKey,
  useLiveSourcesEncoderKeysCreate,
  useLiveSourcesEncoderKeysDestroy,
  useLiveSourcesEncoderKeysList,
  useLiveSourcesPartialUpdate,
} from "@/generated/live-sources/live-sources";
import { formatApiError } from "@/lib/formatApiError";
import { formatOsloTime, inOsloTime } from "@/lib/osloTime";
import { Button } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { nb } from "date-fns/locale/nb";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EncoderSettings } from "./EncoderSettings";

/** The one look at a new key: its settings, ready to paste into the encoder. */
const IssuedKey = ({ issued, onDone }: { issued: IssuedEncoderKey; onDone: () => void }) => (
  <div
    aria-label={`Ny nøkkel «${issued.label}»`}
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
 * A source's encoder keys: issue one per encoder, so each can be revoked on
 * its own. Those who can't set up live transmission see the list only.
 */
export const EncoderKeys = ({ source, maySetUp }: { source: LiveSource; maySetUp: boolean }) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const queryKey = getLiveSourcesEncoderKeysListQueryKey(source.id);
  const keys = useLiveSourcesEncoderKeysList(source.id);
  const create = useLiveSourcesEncoderKeysCreate();
  const revoke = useLiveSourcesEncoderKeysDestroy();
  const update = useLiveSourcesPartialUpdate();
  const [label, setLabel] = useState("");
  const [issued, setIssued] = useState<IssuedEncoderKey>();

  const issue = async () => {
    const response = await create.mutateAsync({
      id: source.id,
      data: { label: label.trim() },
    });
    setIssued(response.data);
    setLabel("");
    await queryClient.invalidateQueries({ queryKey });
  };

  const setEnabled = async (enabled: boolean) => {
    await update.mutateAsync({ id: source.id, data: { enabled } });
    router.refresh();
  };

  const error = create.error ?? revoke.error ?? update.error;

  return (
    <section className="space-y-3 border-t border-default-200 pt-4 md:col-span-2">
      <h3 className="font-semibold">Koder-nøkler</h3>
      {issued ? <IssuedKey issued={issued} onDone={() => setIssued(undefined)} /> : null}
      {keys.isLoading ? <p>Laster nøkler…</p> : null}
      {keys.data && keys.data.data.length === 0 ? (
        <p className="text-sm text-default-600">
          Ingen nøkler ennå. En koder trenger en nøkkel for å sende til denne kilden.
        </p>
      ) : null}
      <ul className="space-y-1">
        {(keys.data?.data ?? []).map((key) => (
          <li className="flex items-center gap-2 border-b border-default-200 py-2" key={key.id}>
            <span className="min-w-0 grow">
              <span className="block truncate font-medium">{key.label}</span>
              <span className="text-xs text-default-500">
                Laget {format(inOsloTime(key.createdAt), "d. MMM yyyy", { locale: nb })} kl.{" "}
                {formatOsloTime(key.createdAt)}
              </span>
            </span>
            {maySetUp ? (
              <Button
                aria-label={`Trekk tilbake «${key.label}»`}
                isDisabled={revoke.isPending}
                size="sm"
                variant="danger-soft"
                onPress={() =>
                  revoke
                    .mutateAsync({ id: source.id, keyPk: key.id })
                    .then(() => queryClient.invalidateQueries({ queryKey }))
                    .catch(() => undefined)
                }
              >
                Trekk tilbake
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
      {maySetUp && source.enabled ? (
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void issue().catch(() => undefined);
          }}
        >
          <div className="min-w-48 grow">
            <FormInput
              description="Hvilken koder den er til, f.eks. «ATEM i studio»."
              label="Ny nøkkel"
              value={label}
              onValueChange={setLabel}
            />
          </div>
          <Button isDisabled={!label.trim() || create.isPending} type="submit">
            Lag nøkkel
          </Button>
        </form>
      ) : null}
      {maySetUp ? (
        <Button
          isDisabled={update.isPending}
          size="sm"
          variant="tertiary"
          onPress={() => void setEnabled(!source.enabled).catch(() => undefined)}
        >
          {source.enabled ? "Slå av kilden" : "Slå på kilden"}
        </Button>
      ) : null}
      {maySetUp ? (
        <p className="text-xs text-default-600">
          En kilde som er slått av, tar ikke imot signal og kan ikke settes i sendeplanen.
        </p>
      ) : null}
      {error ? <p role="alert">{formatApiError(error)}</p> : null}
    </section>
  );
};
