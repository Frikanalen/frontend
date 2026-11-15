"use client";
import { tomorrow } from "@/app/requests/dates";
import {
  ScreenTextEditor,
  screenTextState,
  type ScreenText,
} from "@/components/screen-text/ScreenTextEditor";
import { ClockField } from "@/components/time/ClockField";
import { DayField } from "@/components/time/DayField";
import type { Bulletin } from "@/generated/frikanalenDjangoAPI.schemas";
import {
  useNewsBulletinsCreate,
  useNewsBulletinsDestroy,
  useNewsBulletinsPartialUpdate,
} from "@/generated/news/news";
import { formatApiError } from "@/lib/formatApiError";
import { Button, Modal } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PRIORITIES, instantOf, shortestGapSeconds, whenOf, type When } from "./bulletins";

type Draft = ScreenText & {
  onAir: boolean;
  onInfographics: boolean;
  isPublished: boolean;
  startsAt: When | null;
  endsAt: When | null;
  priority: number;
};

const EMPTY: Draft = {
  template: "standard",
  heading: "",
  text: "",
  onAir: true,
  onInfographics: true,
  isPublished: false,
  startsAt: null,
  endsAt: null,
  priority: 0,
};

const draftOf = (bulletin: Bulletin): Draft => ({
  template: bulletin.template ?? "standard",
  heading: bulletin.heading,
  text: bulletin.text,
  onAir: bulletin.onAir ?? true,
  onInfographics: bulletin.onInfographics ?? true,
  isPublished: bulletin.isPublished ?? false,
  startsAt: whenOf(bulletin.startsAt),
  endsAt: whenOf(bulletin.endsAt),
  priority: bulletin.priority ?? 0,
});

const Check = ({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (_checked: boolean) => void;
  children: React.ReactNode;
}) => (
  <label className="flex cursor-pointer items-start gap-2 text-sm">
    <input
      checked={checked}
      className="mt-0.5 size-4 accent-[var(--accent)]"
      type="checkbox"
      onChange={(event) => onChange(event.target.checked)}
    />
    <span>{children}</span>
  </label>
);

/** A date and a time that can be left out: "from now" or "until taken down". */
const OptionalWhen = ({
  legend,
  unset,
  add,
  value,
  onChange,
}: {
  legend: string;
  /** What it means to leave it out. */
  unset: string;
  /** The button that sets a time. */
  add: string;
  value: When | null;
  onChange: (_value: When | null) => void;
}) => (
  <fieldset className="space-y-1">
    <legend className="text-sm font-medium">{legend}</legend>
    {value ? (
      <div className="flex flex-wrap items-end gap-2">
        <DayField
          className="w-40"
          label="Dato"
          value={value.date}
          onChange={(date) => onChange({ ...value, date })}
        />
        <ClockField
          className="w-28"
          label="Klokka"
          minutes={value.minutes}
          onChange={(minutes) => onChange({ ...value, minutes })}
        />
        <Button size="sm" variant="tertiary" onPress={() => onChange(null)}>
          Fjern
        </Button>
      </div>
    ) : (
      <div className="flex flex-wrap items-center gap-3 text-sm text-default-600">
        {unset}
        <Button
          size="sm"
          variant="secondary"
          onPress={() => onChange({ date: tomorrow(), minutes: 12 * 60 })}
        >
          {add}
        </Button>
      </div>
    )}
  </fieldset>
);

/**
 * Writes or corrects one of the channel's bulletins: the text, in the editor
 * shared with the text posters, then where and when it shows.
 */
export const BulletinEditor = ({
  editing,
  isOpen,
  onClose,
}: {
  /** The bulletin being corrected; a new one when null. */
  editing: Bulletin | null;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const queryClient = useQueryClient();
  const create = useNewsBulletinsCreate();
  const update = useNewsBulletinsPartialUpdate();
  const destroy = useNewsBulletinsDestroy();
  // Mounted afresh each time it opens.
  const [draft, setDraft] = useState<Draft>(() => (editing ? draftOf(editing) : EMPTY));
  const set = (change: Partial<Draft>) => setDraft((current) => ({ ...current, ...change }));
  const { valid: readable, seconds } = screenTextState(draft);
  const starts = instantOf(draft.startsAt);
  const ends = instantOf(draft.endsAt);
  const datesMissing =
    (draft.startsAt !== null && !draft.startsAt.date) ||
    (draft.endsAt !== null && !draft.endsAt.date);
  const backwards = starts !== null && ends !== null && Date.parse(ends) <= Date.parse(starts);
  const valid = readable && draft.text.trim() !== "" && !datesMissing && !backwards;
  const pending = create.isPending || update.isPending || destroy.isPending;
  const error = create.error ?? update.error ?? destroy.error;
  const title = editing ? "Endre melding" : "Ny melding";

  const close = () => {
    create.reset();
    update.reset();
    destroy.reset();
    onClose();
  };
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["/api/news/bulletins"] });

  const save = async (isPublished: boolean) => {
    if (!valid) return;
    const data = {
      template: draft.template,
      heading: draft.heading.trim(),
      text: draft.text.trim(),
      onAir: draft.onAir,
      onInfographics: draft.onInfographics,
      priority: draft.priority,
      startsAt: starts,
      endsAt: ends,
      isPublished,
    };
    if (editing) await update.mutateAsync({ id: editing.id, data });
    else await create.mutateAsync({ data });
    await refresh();
    close();
  };

  const remove = async () => {
    if (!editing) return;
    await destroy.mutateAsync({ id: editing.id });
    await refresh();
    close();
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => (open ? undefined : close())}>
      <Modal.Backdrop isDismissable={!pending}>
        <Modal.Container scroll="outside" size="cover">
          <Modal.Dialog>
            <form
              aria-label={title}
              onSubmit={(event) => {
                event.preventDefault();
                void save(draft.isPublished).catch(() => undefined);
              }}
            >
              <Modal.Header>
                <Modal.Heading>{title}</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="space-y-4">
                <ScreenTextEditor
                  autoFocus
                  kind="bulletin"
                  value={draft}
                  onChange={(text) => set(text)}
                >
                  <fieldset className="space-y-2">
                    <legend className="text-sm font-medium">Hvor den vises</legend>
                    <Check checked={draft.onAir} onChange={(onAir) => set({ onAir })}>
                      På lufta, i pausene mellom programmene.{" "}
                      <span className="text-default-600">
                        Hele meldingen eller ingenting: den får plass i pauser på minst{" "}
                        {shortestGapSeconds(seconds)} sekunder.
                      </span>
                    </Check>
                    <Check
                      checked={draft.onInfographics}
                      onChange={(onInfographics) => set({ onInfographics })}
                    >
                      I infografikken, sammen med vær, tog og sendeplan.
                    </Check>
                  </fieldset>
                  <OptionalWhen
                    add="Velg starttid"
                    legend="Vises fra"
                    unset="Fra den blir publisert."
                    value={draft.startsAt}
                    onChange={(startsAt) => set({ startsAt })}
                  />
                  <OptionalWhen
                    add="Velg sluttid"
                    legend="Vises til"
                    unset="Til den blir tatt ned."
                    value={draft.endsAt}
                    onChange={(endsAt) => set({ endsAt })}
                  />
                  {backwards ? (
                    <p className="text-sm text-danger" role="alert">
                      Sluttiden må være etter starttiden.
                    </p>
                  ) : null}
                  <label className="flex flex-col gap-1 text-sm font-medium">
                    Prioritet
                    <select
                      className="w-56 rounded-lg border border-default-300 bg-background px-3 py-2 font-normal"
                      value={draft.priority}
                      onChange={(event) => set({ priority: Number(event.target.value) })}
                    >
                      {PRIORITIES.map(({ value, label }) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                      {PRIORITIES.some(({ value }) => value === draft.priority) ? null : (
                        <option value={draft.priority}>{draft.priority}</option>
                      )}
                    </select>
                    <span className="font-normal text-default-600">
                      Er pausen for kort til alle meldingene, vises de med høyest prioritet. Like
                      viktige meldinger bytter på å gå først.
                    </span>
                  </label>
                </ScreenTextEditor>
                {error ? <p role="alert">{formatApiError(error)}</p> : null}
              </Modal.Body>
              <Modal.Footer>
                {editing ? (
                  <Button
                    className="me-auto"
                    isDisabled={pending}
                    variant="danger"
                    onPress={() => void remove().catch(() => undefined)}
                  >
                    Slett meldingen
                  </Button>
                ) : null}
                <Button variant="tertiary" onPress={close}>
                  Avbryt
                </Button>
                {draft.isPublished ? (
                  <>
                    <Button
                      isDisabled={!valid || pending}
                      variant="secondary"
                      onPress={() => void save(false).catch(() => undefined)}
                    >
                      Ta ned
                    </Button>
                    <Button isDisabled={!valid || pending} type="submit">
                      Lagre
                    </Button>
                  </>
                ) : (
                  <>
                    <Button isDisabled={!valid || pending} type="submit" variant="secondary">
                      Lagre som utkast
                    </Button>
                    <Button
                      isDisabled={!valid || pending}
                      onPress={() => void save(true).catch(() => undefined)}
                    >
                      Publiser
                    </Button>
                  </>
                )}
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
};
