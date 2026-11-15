"use client";
import { FormInput, FormTextArea } from "@/components/FormField";
import cx from "classnames";
import { type ReactNode, useRef, useState } from "react";
import {
  HEADING_LENGTH,
  MOST_PAGES,
  TEXT_LENGTH,
  pageAtOffset,
  pageSeconds,
  pageStarts,
  pagesProblem,
  readingSeconds,
  screenPages,
} from "./pages";
import { ScreenPreview } from "./ScreenPreview";

/** The templates the on-air graphics have, and what they are called here. */
export const SCREEN_TEMPLATES = { standard: "Vanlig", notice: "Viktig melding" } as const;
export type ScreenTemplate = keyof typeof SCREEN_TEMPLATES;

export type ScreenText = { template: ScreenTemplate; heading: string; text: string };

const LOOKS = { day: "Dag", night: "Kveld" } as const;
type Look = keyof typeof LOOKS;

/** What can be said about a text before it is saved. */
export const screenTextState = ({ heading, text }: Pick<ScreenText, "heading" | "text">) => {
  const problem = pagesProblem(text.trim());
  return {
    problem,
    /** Seconds to read every page once. */
    seconds: readingSeconds(heading.trim(), text.trim()),
    valid: heading.trim() !== "" && problem === null,
  };
};

const seconds = (value: number) => `${Math.round(value)} s`;

/**
 * Writes a text for the television screen: a heading and a text on one of
 * the on-air graphics templates. It is used for a member's text poster and
 * for the channel's bulletins.
 *
 * The text is shown as the screen will page it, beside the field it is
 * typed in: the page the cursor is on, drawn by the on-air graphics
 * themselves, and every page listed with the time it is held.
 */
export const ScreenTextEditor = ({
  kind,
  value,
  onChange,
  from,
  autoFocus,
  children,
}: {
  kind: "poster" | "bulletin";
  value: ScreenText;
  onChange: (_value: ScreenText) => void;
  /** Text posters: the organization named on the poster. */
  from?: string;
  autoFocus?: boolean;
  /** More fields, under the text. */
  children?: ReactNode;
}) => {
  const textArea = useRef<HTMLTextAreaElement>(null);
  const [look, setLook] = useState<Look>("day");
  const [wanted, setWanted] = useState(0);
  const pages = screenPages(value.text);
  const times = pageSeconds(value.heading.trim(), value.text.trim());
  const page = Math.min(wanted, pages.length - 1);
  const { problem, seconds: total } = screenTextState(value);
  const set = (change: Partial<ScreenText>) => onChange({ ...value, ...change });

  /** Follow the cursor: the preview shows the page being written. */
  const follow = () => {
    const field = textArea.current;
    if (field) setWanted(pageAtOffset(field.value, field.selectionStart));
  };

  const show = (index: number) => {
    setWanted(index);
    const field = textArea.current;
    const start = pageStarts(value.text)[index];
    if (!field || start === undefined) return;
    field.focus();
    field.setSelectionRange(start, start);
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-x-6 gap-y-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <section
        aria-label="Slik blir det på skjermen"
        className="space-y-2 lg:sticky lg:top-4 lg:order-last lg:self-start"
      >
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="me-auto text-sm font-semibold">Slik blir det på skjermen</h3>
          {kind === "poster" ? (
            <div
              aria-label="Tid på døgnet"
              className="flex rounded-lg border border-default-300 p-0.5"
              role="group"
            >
              {(Object.keys(LOOKS) as Look[]).map((choice) => (
                <button
                  aria-pressed={look === choice}
                  className={cx(
                    "rounded-md px-3 py-1 text-sm font-semibold",
                    look === choice ? "bg-foreground text-background" : "text-default-700",
                  )}
                  key={choice}
                  type="button"
                  onClick={() => setLook(choice)}
                >
                  {LOOKS[choice]}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <ScreenPreview
          content={{
            kind,
            template: value.template,
            heading: value.heading || "Overskrift",
            text: value.text,
            page,
            look: kind === "poster" ? look : undefined,
            from,
          }}
          title={`Side ${page + 1} av ${pages.length} slik den blir på skjermen`}
        />
        <ol aria-label="Sidene" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {pages.map((text, index) => (
            <li key={index}>
              <button
                aria-current={index === page ? "true" : undefined}
                aria-label={`Vis side ${index + 1}`}
                className={cx(
                  "flex h-full w-full flex-col gap-0.5 rounded-lg border-2 px-2.5 py-1.5 text-left",
                  index === page
                    ? "border-accent bg-accent/5"
                    : "border-default-200 hover:border-default-400",
                  index >= MOST_PAGES && "border-danger",
                )}
                type="button"
                onClick={() => show(index)}
              >
                <span className="flex items-baseline justify-between gap-2 text-xs font-semibold">
                  Side {index + 1}
                  <span className="font-normal text-default-600 tabular-nums">
                    {seconds(times[index] ?? 0)}
                  </span>
                </span>
                <span className="line-clamp-2 text-xs text-default-600">
                  {text || "Bare overskriften"}
                </span>
              </button>
            </li>
          ))}
        </ol>
        <p className="text-sm text-default-600" role="status">
          {pages.length === 1 ? "Én side" : `${pages.length} sider`}, {total} sekunder å lese.
          {kind === "poster" ? " Lys om dagen, mørk om kvelden." : ""}
        </p>
      </section>

      <div className="space-y-4">
        <fieldset>
          <legend className="mb-1 text-sm font-medium">Mal</legend>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(SCREEN_TEMPLATES) as ScreenTemplate[]).map((template) => (
              <label
                className={cx(
                  "flex cursor-pointer items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-semibold",
                  value.template === template ? "border-accent" : "border-default-200",
                )}
                key={template}
              >
                <input
                  checked={value.template === template}
                  className="sr-only"
                  name="template"
                  type="radio"
                  onChange={() => set({ template })}
                />
                <span
                  aria-hidden
                  className={cx(
                    "h-5 w-8 rounded-sm",
                    // A poster is light by day and dark by night; the slate is always light.
                    kind === "poster"
                      ? "bg-[linear-gradient(90deg,#f5efe4_50%,#0f1926_50%)]"
                      : "border border-default-300 bg-[#f5efe4]",
                    template === "notice" && "border-l-4 border-l-[#faaa3f]",
                  )}
                />
                {SCREEN_TEMPLATES[template]}
              </label>
            ))}
          </div>
        </fieldset>
        <FormInput
          autoFocus={autoFocus}
          description={`${value.heading.length} av ${HEADING_LENGTH} tegn`}
          label="Overskrift"
          maxLength={HEADING_LENGTH}
          value={value.heading}
          onValueChange={(heading) => set({ heading })}
        />
        <FormTextArea
          description={`En tom linje gir ny side. Et langt avsnitt deles av seg selv der en setning slutter. Høyst ${MOST_PAGES} sider.`}
          errorMessage={problem ?? undefined}
          isInvalid={problem !== null}
          label="Tekst"
          maxLength={TEXT_LENGTH}
          ref={textArea}
          rows={9}
          value={value.text}
          onClick={follow}
          onKeyUp={follow}
          onSelect={follow}
          onValueChange={(text) => {
            set({ text });
            follow();
          }}
        />
        {children}
      </div>
    </div>
  );
};
