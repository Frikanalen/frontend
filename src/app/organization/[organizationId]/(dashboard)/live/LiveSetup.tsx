"use client";
import { FormInput } from "@/components/FormField";
import type { IssuedEncoderKey, LiveSource } from "@/generated/frikanalenDjangoAPI.schemas";
import { useLiveSourcesEncoderKeysCreate } from "@/generated/live-sources/live-sources";
import { useOrganizationLiveSourcesCreate } from "@/generated/organization/organization";
import { formatApiError } from "@/lib/formatApiError";
import { Button } from "@heroui/react";
import cx from "classnames";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { AirtimeHandoff } from "./AirtimeHandoff";
import {
  ENCODERS,
  PULL_PROTOCOLS,
  RECOMMENDED_ENCODING,
  type EncoderId,
  type PullProtocolId,
} from "./connections";
import { EncoderSettings } from "./EncoderSettings";
import { LiveSourcePreview } from "./LiveSourcePreview";

type Mode = "push" | "pull";

const STEPS = ["Velg måte", "Koble til", "Test", "Sett på lufta"];

const Steps = ({ current }: { current: number }) => (
  <ol aria-label="Stegene i oppsettet" className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
    {STEPS.map((label, index) => (
      <li
        aria-current={index === current ? "step" : undefined}
        className={cx(
          "flex items-center gap-2",
          index === current ? "font-semibold" : "text-default-600",
        )}
        key={label}
      >
        <span
          className={cx(
            "flex size-6 items-center justify-center text-xs font-bold",
            index < current
              ? "bg-brand-green text-white"
              : index === current
                ? "bg-foreground text-background"
                : "border border-default-300",
          )}
        >
          {index < current ? "✓" : index + 1}
        </span>
        {label}
      </li>
    ))}
  </ol>
);

const ChoiceCard = ({
  title,
  keywords,
  children,
  action,
  onChoose,
}: {
  title: string;
  keywords: string;
  children: ReactNode;
  action: string;
  onChoose: () => void;
}) => (
  <section className="flex flex-col gap-3 border border-default-300 bg-background p-5">
    <h3 className="text-xl font-bold">{title}</h3>
    <p className="font-mono text-xs font-semibold tracking-wide text-default-600 uppercase">
      {keywords}
    </p>
    <div className="grow space-y-2 text-sm text-default-700">{children}</div>
    <Button className="self-start" variant="primary" onPress={onChoose}>
      {action}
    </Button>
  </section>
);

const Radio = <T extends string>({
  name,
  value,
  current,
  title,
  hint,
  onChoose,
}: {
  name: string;
  value: T;
  current: T;
  title: string;
  hint: string;
  onChoose: (_value: T) => void;
}) => (
  <label
    className={cx(
      "flex cursor-pointer flex-col border px-3 py-2 text-sm",
      current === value ? "border-accent bg-accent/10" : "border-default-300",
    )}
  >
    <input
      checked={current === value}
      className="sr-only"
      name={name}
      type="radio"
      value={value}
      onChange={() => onChoose(value)}
    />
    <span className="font-semibold">{title}</span>
    <span className="text-default-600">{hint}</span>
  </label>
);

/**
 * Setting up a live source as a path: choose whether the signal is sent to
 * Frikanalen or fetched by it, connect, see it arrive, and put it in the
 * schedule. The source exists from step two on; the later steps only help
 * it get on air, so leaving early loses nothing.
 */
export const LiveSetup = ({
  organizationId,
  onDone,
  canCancel,
}: {
  organizationId: number;
  onDone: () => void;
  /** Whether there is a list of sources to go back to. */
  canCancel: boolean;
}) => {
  const router = useRouter();
  const createSource = useOrganizationLiveSourcesCreate();
  const createKey = useLiveSourcesEncoderKeysCreate();
  const [mode, setMode] = useState<Mode>();
  const [name, setName] = useState("Studio");
  const [encoder, setEncoder] = useState<EncoderId>("obs");
  const [protocol, setProtocol] = useState<PullProtocolId>("srt");
  const [pullUrl, setPullUrl] = useState("");
  const [source, setSource] = useState<LiveSource>();
  const [issued, setIssued] = useState<IssuedEncoderKey>();
  const [error, setError] = useState<string>();

  const pending = createSource.isPending || createKey.isPending;
  const chosenProtocol = PULL_PROTOCOLS.find(({ id }) => id === protocol)!;

  const connect = async () => {
    setError(undefined);
    try {
      const created =
        source ??
        (
          await createSource.mutateAsync({
            id: organizationId,
            data: { name: name.trim(), ...(mode === "pull" ? { pullUrl: pullUrl.trim() } : {}) },
          })
        ).data;
      setSource(created);
      if (mode === "push") {
        const key = await createKey.mutateAsync({
          id: created.id,
          data: { label: ENCODERS.find(({ id }) => id === encoder)!.name },
        });
        setIssued(key.data);
      }
      router.refresh();
    } catch (caught) {
      setError(formatApiError(caught));
    }
  };

  const connected = source !== undefined && (mode === "pull" || issued !== undefined);

  return (
    <section aria-labelledby="setup-heading" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold" id="setup-heading">
          Ny direktekilde
        </h2>
        {canCancel && !connected ? (
          <Button variant="tertiary" onPress={onDone}>
            Avbryt
          </Button>
        ) : null}
      </div>
      <Steps current={connected ? 2 : mode ? 1 : 0} />

      {!mode ? (
        <div className="grid gap-4 md:grid-cols-2">
          <ChoiceCard
            action="Send til Frikanalen"
            keywords="Push · SRT · RTMP"
            title="Send til Frikanalen"
            onChoose={() => setMode("push")}
          >
            <p>Koderen deres sender signalet til oss. Dette er det vanlige.</p>
            <p>
              For OBS, vMix, ATEM, Web Presenter og andre kodere. Dere får innstillinger å lime inn
              i koderen.
            </p>
          </ChoiceCard>
          <ChoiceCard
            action="La Frikanalen hente"
            keywords="Pull · SRT · RTMP · RTSP · HLS"
            title="La Frikanalen hente"
            onChoose={() => setMode("pull")}
          >
            <p>Vi henter en strøm som allerede finnes, fra en adresse dere oppgir.</p>
            <p>
              For IP-kameraer, en sending som alt strømmes et annet sted, eller en avsender som
              venter på oppkobling. Ingenting å installere.
            </p>
          </ChoiceCard>
        </div>
      ) : null}

      {mode && !connected ? (
        <form
          aria-label={mode === "push" ? "Koble til koderen" : "Oppgi adressen"}
          className="max-w-2xl space-y-5 bg-background p-5"
          onSubmit={(event) => {
            event.preventDefault();
            void connect();
          }}
        >
          <FormInput
            description="Ett navn per sted dere sender fra, f.eks. «Studio» eller «Kirkesalen»."
            label="Navn på kilden"
            value={name}
            onValueChange={setName}
          />

          {mode === "push" ? (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Hva sender dere med?</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {ENCODERS.map(({ id, name: title, hint }) => (
                  <Radio
                    current={encoder}
                    hint={hint}
                    key={id}
                    name="encoder"
                    title={title}
                    value={id}
                    onChoose={setEncoder}
                  />
                ))}
              </div>
              <p className="text-sm text-default-600">
                Neste steg viser innstillingene for koderen. Vi tar imot både SRT og RTMP.
              </p>
            </fieldset>
          ) : (
            <>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Hva slags strøm er det?</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {PULL_PROTOCOLS.map(({ id, name: title, hint }) => (
                    <Radio
                      current={protocol}
                      hint={hint}
                      key={id}
                      name="protocol"
                      title={title}
                      value={id}
                      onChoose={setProtocol}
                    />
                  ))}
                </div>
              </fieldset>
              <FormInput
                description={`F.eks. ${chosenProtocol.example}. Ta med passord, strømnøkkel eller passphrase i adressen.`}
                label="Adressen vi skal hente fra"
                value={pullUrl}
                onValueChange={setPullUrl}
              />
              <p className="text-sm text-default-600">
                Adressen må kunne nås fra internett. Den lagres kryptert og vises ikke igjen; bare
                vertsnavnet står på siden. Vi kobler til når noen ser på kilden og like før en
                sending. Anbefalt koding: {RECOMMENDED_ENCODING}
              </p>
            </>
          )}

          {error ? (
            <p className="text-sm font-medium text-danger-700" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              isDisabled={!name.trim() || (mode === "pull" && !pullUrl.trim())}
              isPending={pending}
              type="submit"
              variant="primary"
            >
              {mode === "push" ? "Opprett kilde og vis innstillinger" : "Opprett kilde og test"}
            </Button>
            {source ? null : (
              <Button variant="tertiary" onPress={() => setMode(undefined)}>
                Tilbake
              </Button>
            )}
          </div>
        </form>
      ) : null}

      {connected && source ? (
        <div className="space-y-6">
          {issued ? (
            <section
              aria-label={`Innstillinger for «${source.name}»`}
              className="max-w-3xl space-y-3 bg-background p-5"
            >
              <h3 className="font-semibold">Innstillinger til koderen</h3>
              <EncoderSettings initialEncoder={encoder} issued={issued} />
            </section>
          ) : null}

          <LiveSourcePreview autoStart source={source} startOpen>
            <p className="text-sm text-default-600 md:col-span-2">
              {source.isPulled
                ? "Vi kobler til adressen nå. Kommer bildet opp her, virker den."
                : "Start sendingen i koderen. Kommer bildet opp her og lydmåleren beveger seg, er alt klart."}
            </p>
          </LiveSourcePreview>

          <div className="max-w-3xl bg-background p-5">
            <AirtimeHandoff organizationId={organizationId} source={source} />
          </div>

          <Button variant={canCancel ? "primary" : "secondary"} onPress={onDone}>
            Ferdig
          </Button>
        </div>
      ) : null}
    </section>
  );
};
