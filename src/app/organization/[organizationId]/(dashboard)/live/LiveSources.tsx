"use client";
import type { LiveSource } from "@/generated/frikanalenDjangoAPI.schemas";
import { Button } from "@heroui/react";
import { useState } from "react";
import { LiveSetup } from "./LiveSetup";
import { SourceRow } from "./SourceRow";

/**
 * The page's two states. With no sources it is the guided setup. With
 * sources it is their status, and "Ny direktekilde" opens the same setup.
 */
export const LiveSources = ({
  organizationId,
  sources,
  maySetUp,
  openSetup,
}: {
  organizationId: number;
  sources: readonly LiveSource[];
  maySetUp: boolean;
  /** A source whose setup is to be open on arrival. */
  openSetup?: number;
}) => {
  // The setup stays up until the member closes it, though its source joins
  // the list (and the list stops being empty) as soon as it is created.
  const [setting, setSetting] = useState(maySetUp && sources.length === 0);

  if (setting) {
    return (
      <LiveSetup
        canCancel={sources.length > 0}
        organizationId={organizationId}
        onDone={() => setSetting(false)}
      />
    );
  }

  const row = (source: LiveSource) => (
    <SourceRow
      initiallyOpen={source.id === openSetup}
      key={source.id}
      maySetUp={maySetUp}
      organizationId={organizationId}
      source={source}
    />
  );
  const active = sources.filter((source) => source.enabled !== false);
  const off = sources.filter((source) => source.enabled === false);

  return (
    <div className="space-y-4">
      {maySetUp ? (
        <div className="flex justify-end">
          <Button variant="secondary" onPress={() => setSetting(true)}>
            + Ny direktekilde
          </Button>
        </div>
      ) : null}
      {sources.length === 0 ? <p>Organisasjonen har ingen direktekilder ennå.</p> : null}
      {active.map(row)}
      {off.length > 0 ? (
        // Out of the way, but not gone: they are part of what has aired.
        <details className="group" open={off.some((source) => source.id === openSetup)}>
          <summary className="cursor-pointer py-2 font-semibold text-default-700">
            Avslåtte kilder ({off.length})
          </summary>
          <div className="mt-2 space-y-4">{off.map(row)}</div>
        </details>
      ) : null}
    </div>
  );
};
