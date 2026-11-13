"use client";
import { FormInput } from "@/components/FormField";
import type { LiveSource, Video } from "@/generated/frikanalenDjangoAPI.schemas";
import { useVideosCreate, videosRetrieve } from "@/generated/videos/videos";
import { formatApiError } from "@/lib/formatApiError";
import { Button, Modal } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { formatDuration } from "./duration";

export type ProgrammeKind = "placeholder" | "live";

const pad = (n: number) => String(n).padStart(2, "0");

/** Minutes as the API's "HH:MM:SS". */
const minutesDuration = (minutes: number) =>
  `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}:00`;

const TEXT = {
  placeholder: {
    heading: "Ny plassholder",
    intro:
      "En plassholder holder av plass i listen til en video som ikke er ferdig ennå. Last opp filen når den er klar; den kan komme etter at listen er låst.",
  },
  live: {
    heading: "Ny direktesending",
    intro:
      "En direktesending sendes direkte fra en av organisasjonens direktekilder, helt til det lastes opp et opptak til den.",
  },
} as const;

/**
 * Makes a programme that has no file yet and puts it in the list: a
 * placeholder, or a live programme airing from one of the organization's
 * sources. The length starts out as the time left in the window.
 */
export const NewProgrammeModal = ({
  kind,
  organizationId,
  sources,
  remaining,
  onClose,
  onCreated,
  initialSourceId,
}: {
  initialSourceId?: number;
  /** Which to make; the modal is open while this is set. */
  kind: ProgrammeKind | undefined;
  organizationId: number;
  /** The organization's enabled live sources. */
  sources: readonly LiveSource[];
  remaining: number;
  onClose: () => void;
  onCreated: (_video: Video) => void;
}) => {
  const queryClient = useQueryClient();
  const create = useVideosCreate();
  const left = Math.floor(Math.max(0, remaining) / 60000);
  const [name, setName] = useState("");
  const [minutes, setMinutes] = useState<string>();
  const [sourceId, setSourceId] = useState(initialSourceId);
  const live = kind === "live";
  const source = sources.find(({ id }) => id === sourceId) ?? sources[0];
  const length = Number(minutes ?? left);
  const valid =
    name.trim() !== "" && Number.isInteger(length) && length > 0 && (!live || source != null);

  const close = () => {
    setName("");
    setMinutes(undefined);
    create.reset();
    onClose();
  };

  const submit = async () => {
    if (!valid) return;
    const response = await create.mutateAsync({
      data: {
        name: name.trim(),
        duration: minutesDuration(length),
        organization: organizationId,
        categories: [],
        ...(live ? { liveSource: source.id } : {}),
      },
    });
    await queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
    // The create answers in the write shape, with the organization as a key.
    const created = await videosRetrieve(response.data.id);
    onCreated(created.data);
    close();
  };

  const text = TEXT[kind ?? "placeholder"];

  return (
    <Modal isOpen={kind != null} onOpenChange={(open) => (open ? undefined : close())}>
      <Modal.Backdrop isDismissable={!create.isPending}>
        <Modal.Container size="md">
          <Modal.Dialog>
            <form
              aria-label={text.heading}
              onSubmit={(event) => {
                event.preventDefault();
                void submit().catch(() => undefined);
              }}
            >
              <Modal.Header>
                <Modal.Heading>{text.heading}</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="space-y-3">
                <p className="text-sm text-default-600">{text.intro}</p>
                {live && sources.length === 0 ? (
                  <p className="text-sm">
                    Organisasjonen har ingen direktekilder ennå.{" "}
                    <Link className="underline" href={`/organization/${organizationId}/live`}>
                      Sett opp en under Direktesending
                    </Link>
                    .
                  </p>
                ) : (
                  <>
                    <FormInput autoFocus label="Tittel" value={name} onValueChange={setName} />
                    <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-2">
                      <FormInput
                        description={`${formatDuration(Math.max(0, remaining))} igjen`}
                        label="Lengde (min)"
                        min={1}
                        type="number"
                        value={minutes ?? String(left)}
                        onValueChange={setMinutes}
                      />
                      {live ? (
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
                      ) : null}
                    </div>
                  </>
                )}
                {create.isError ? <p role="alert">{formatApiError(create.error)}</p> : null}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="tertiary" onPress={close}>
                  Avbryt
                </Button>
                <Button isDisabled={!valid || create.isPending} type="submit">
                  Opprett og legg til
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
};
