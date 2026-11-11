"use client";
import { FormInput } from "@/components/FormField";
import type { LiveSource, Video } from "@/generated/frikanalenDjangoAPI.schemas";
import { useVideosCreate, videosRetrieve } from "@/generated/videos/videos";
import { formatApiError } from "@/lib/formatApiError";
import { Button as HeroButton } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { formatDuration } from "./duration";

const pad = (n: number) => String(n).padStart(2, "0");

/** Minutes as the API's "HH:MM:SS". */
const minutesDuration = (minutes: number) =>
  `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}:00`;

/**
 * Creates a live programme: a video with a live source and no file yet. It
 * airs live from that source until a recording is uploaded to it, and from
 * the recording after that. The length starts out as the time left.
 */
export const NewLiveProgramme = ({
  organizationId,
  sources,
  remaining,
  onCreated,
}: {
  organizationId: number;
  /** The organization's enabled live sources. */
  sources: readonly LiveSource[];
  remaining: number;
  onCreated: (_video: Video) => void;
}) => {
  const queryClient = useQueryClient();
  const create = useVideosCreate();
  const left = Math.floor(Math.max(0, remaining) / 60000);
  const [name, setName] = useState("");
  const [minutes, setMinutes] = useState<string>();
  const [sourceId, setSourceId] = useState<number>();
  const source = sources.find(({ id }) => id === sourceId) ?? sources[0];
  const length = Number(minutes ?? left);
  const valid = name.trim() !== "" && Number.isInteger(length) && length > 0 && source != null;

  if (sources.length === 0) {
    return (
      <p className="text-sm text-default-600">
        Organisasjonen har ingen direktekilder. De settes opp under Direktesending på
        organisasjonens side.
      </p>
    );
  }

  const submit = async () => {
    if (!valid) return;
    const response = await create.mutateAsync({
      data: {
        name: name.trim(),
        duration: minutesDuration(length),
        organization: organizationId,
        categories: [],
        liveSource: source.id,
      },
    });
    setName("");
    setMinutes(undefined);
    await queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
    // The create answers in the write shape, with the organization as a key.
    const created = await videosRetrieve(response.data.id);
    onCreated(created.data);
  };

  return (
    <form
      aria-label="Ny direktesending"
      className="space-y-2 rounded-lg border border-default-200 p-3"
      onSubmit={(event) => {
        event.preventDefault();
        void submit().catch(() => undefined);
      }}
    >
      <h3 className="font-medium">Ny direktesending</h3>
      <FormInput label="Tittel" value={name} onValueChange={setName} />
      <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-2">
        <FormInput
          description={`${formatDuration(Math.max(0, remaining))} igjen`}
          label="Lengde (min)"
          min={1}
          type="number"
          value={minutes ?? String(left)}
          onValueChange={setMinutes}
        />
        <label className="flex min-w-0 flex-col gap-1 text-sm font-medium">
          Direktekilde
          <select
            className="rounded-lg border border-default-300 bg-background px-3 py-2"
            value={source?.id ?? ""}
            onChange={(event) => setSourceId(Number(event.target.value))}
          >
            {sources.map(({ id, name: sourceName }) => (
              <option key={id} value={id}>
                {sourceName}
              </option>
            ))}
          </select>
        </label>
      </div>
      {create.isError ? <p role="alert">{formatApiError(create.error)}</p> : null}
      <HeroButton isDisabled={!valid || create.isPending} size="sm" type="submit">
        Opprett og legg til
      </HeroButton>
    </form>
  );
};
