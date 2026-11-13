"use client";
import type { IssuedEncoderKey } from "@/generated/frikanalenDjangoAPI.schemas";
import { Button } from "@heroui/react";
import cx from "classnames";
import { useState } from "react";
import {
  ENCODERS,
  RECOMMENDED_ENCODING,
  connectionFor,
  splitRtmp,
  splitSrt,
  type EncoderId,
} from "./connections";

export const Copyable = ({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) => {
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        <Button
          aria-label={`Kopier ${label}`}
          size="sm"
          variant="tertiary"
          onPress={() =>
            navigator.clipboard.writeText(value).then(
              () => setCopied(true),
              () => undefined,
            )
          }
        >
          {copied ? "Kopiert" : "Kopier"}
        </Button>
      </div>
      <code className="block bg-default-100 p-2 text-xs break-all">{value}</code>
      {note ? <p className="text-xs text-default-600">{note}</p> : null}
    </div>
  );
};

/**
 * The one look at a new key, as the settings the chosen encoder asks for:
 * Server and Stream key for OBS, a settings file for Blackmagic, and the
 * plain addresses for anything else.
 */
export const EncoderSettings = ({
  issued,
  initialEncoder = "obs",
}: {
  issued: IssuedEncoderKey;
  initialEncoder?: EncoderId;
}) => {
  const [encoder, setEncoder] = useState<EncoderId>(initialEncoder);
  const rtmp = connectionFor(issued.connections, "RTMP");
  const srt = connectionFor(issued.connections, "SRT");
  const others = issued.connections.filter(({ label }) => label !== "RTMP" && label !== "SRT");
  const blackmagic = issued.blackmagicConfig
    ? `data:application/xml;charset=utf-8,${encodeURIComponent(issued.blackmagicConfig)}`
    : undefined;

  return (
    <div className="space-y-4">
      <p className="border-l-4 border-warning bg-warning/10 p-3 text-sm font-medium">
        Kopier innstillingene til koderen nå. Passordet vises bare denne ene gangen; mister du det,
        lager du en ny nøkkel.
      </p>
      <div
        aria-label="Koder"
        className="flex flex-wrap gap-x-5 border-b border-default-200"
        role="tablist"
      >
        {ENCODERS.map(({ id, name }) => (
          <button
            aria-selected={encoder === id}
            className={cx(
              "-mb-px border-b-2 py-2 text-sm",
              encoder === id
                ? "border-brand-green font-semibold"
                : "border-transparent text-default-600 hover:text-foreground",
            )}
            key={id}
            role="tab"
            type="button"
            onClick={() => setEncoder(id)}
          >
            {name}
          </button>
        ))}
      </div>

      {encoder === "obs" ? (
        <div className="space-y-3">
          <p className="text-sm text-default-700">
            I OBS: Innstillinger → Strøm. Velg tjenesten <strong>Egendefinert</strong> og lim inn de
            to feltene. La brukernavn og passord stå tomme.
          </p>
          {rtmp ? (
            <>
              <Copyable label="Server" value={splitRtmp(rtmp.url).server} />
              <Copyable label="Strømnøkkel" value={splitRtmp(rtmp.url).streamKey} />
            </>
          ) : (
            <p className="text-sm text-default-700">
              RTMP-adressen er ikke tilgjengelig. Se «Annen koder».
            </p>
          )}
          {srt ? (
            <p className="text-sm text-default-600">
              Vil du heller bruke SRT, velger du «Annen koder» og limer hele SRT-adressen inn som
              Server, uten strømnøkkel.
            </p>
          ) : null}
        </div>
      ) : null}

      {encoder === "blackmagic" ? (
        <div className="space-y-3">
          {blackmagic ? (
            <>
              <a
                className="inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-semibold text-accent-foreground hover:opacity-90"
                download={`frikanalen-${issued.label}.xml`}
                href={blackmagic}
              >
                Last ned oppsett for Blackmagic
              </a>
              <p className="text-sm text-default-700">
                For Web Presenter og ATEM Mini. Åpne Setup-programmet (eller ATEM Software Control),
                last inn filen under Live Stream → Load Streaming Settings, og velg plattformen
                «Frikanalen».
              </p>
            </>
          ) : (
            <p className="text-sm text-default-700">
              Oppsettfilen er ikke tilgjengelig. Bruk adressene under «Annen koder».
            </p>
          )}
        </div>
      ) : null}

      {encoder === "other" ? (
        <div className="space-y-3">
          {srt ? (
            <>
              <Copyable label="SRT" value={srt.url} />
              <Copyable
                label="SRT, strøm-ID for seg"
                note={`Bruk den sammen med adressen ${splitSrt(srt.url).address} hvis koderen har et eget felt for Stream ID. Mange kodere ser bort fra ID-en når den står i adressen.`}
                value={splitSrt(srt.url).streamId}
              />
            </>
          ) : null}
          {rtmp ? (
            <Copyable
              label="RTMP"
              note="La brukernavn og passord i koderen stå tomme. Ikke RTMPS."
              value={rtmp.url}
            />
          ) : null}
          {others.length > 0 ? (
            <details>
              <summary className="cursor-pointer text-sm font-semibold text-link">
                Flere protokoller
              </summary>
              <div className="mt-3 space-y-3">
                {others.map((connection) => (
                  <Copyable
                    key={connection.label}
                    label={connection.label}
                    note={connection.token ? `Token: ${connection.token}` : connection.note}
                    value={connection.url}
                  />
                ))}
              </div>
            </details>
          ) : null}
        </div>
      ) : null}

      <p className="text-sm text-default-600">
        <span className="font-semibold text-foreground">Anbefalt koding:</span>{" "}
        {RECOMMENDED_ENCODING} HEVC og AV1 tas ikke imot.
      </p>
    </div>
  );
};
