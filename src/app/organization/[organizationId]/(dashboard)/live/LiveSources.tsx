"use client";
import type { LiveSource } from "@/generated/frikanalenDjangoAPI.schemas";
import { Button } from "@heroui/react";
import { useState } from "react";
import { EncoderKeys } from "./EncoderKeys";
import { LiveSetup } from "./LiveSetup";
import { LiveSourcePreview } from "./LiveSourcePreview";
import { PullAddress } from "./PullAddress";

/**
 * The page's two states. With no sources it is the guided setup. With
 * sources it is their status, and "Ny direktekilde" opens the same setup.
 */
export const LiveSources = ({
  organizationId,
  sources,
  maySetUp,
}: {
  organizationId: number;
  sources: readonly LiveSource[];
  maySetUp: boolean;
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
      {sources.map((source) => (
        // One source opens and starts by itself; with several, each waits to
        // be asked so the page does not open a connection per source at once.
        <LiveSourcePreview
          autoStart={sources.length === 1}
          key={source.id}
          organizationId={organizationId}
          source={source}
          startOpen={sources.length === 1}
        >
          {source.isPulled ? (
            <PullAddress maySetUp={maySetUp} source={source} />
          ) : (
            <EncoderKeys maySetUp={maySetUp} source={source} />
          )}
        </LiveSourcePreview>
      ))}
    </div>
  );
};
