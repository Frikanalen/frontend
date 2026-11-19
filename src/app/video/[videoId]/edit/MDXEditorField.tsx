"use client";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  useController,
  type Control,
  type FieldPath,
  type FieldValues,
  type RegisterOptions,
} from "react-hook-form";
import { ForwardRefEditor } from "./ForwardRefEditor";
import type { MDXEditorMethods, MDXEditorProps, Translation } from "@mdxeditor/editor";
import { Card } from "@heroui/react";
import { Notice } from "@/components/Notice";
import { mdxEditorNorwegian } from "./mdxEditorNorwegian";

type EditorPassThrough = Omit<
  MDXEditorProps,
  "markdown" | "onChange" | "onBlur" | "ref" | "placeholder" | "onError"
>;

type MDXEditorFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = {
  control: Control<TFieldValues>;
  name: TName;
  rules?: RegisterOptions<TFieldValues, TName>;
  label?: string;
  /** Optional short description shown under the label */
  description?: string;
  placeholder?: string;
  className?: string;
  editorProps?: EditorPassThrough;
};

export function MDXEditorField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  rules,
  label,
  description,
  placeholder,
  className,
  editorProps,
}: MDXEditorFieldProps<TFieldValues, TName>) {
  const { field, fieldState } = useController({ control, name, rules });
  const editorRef = useRef<MDXEditorMethods | null>(null);
  // Set when the editor can't read the text (a table, raw HTML, a code
  // block...). It then shows only what came before that point and drops
  // whatever is typed, so the text is handed to a plain text box instead.
  const [unreadable, setUnreadable] = useState(false);

  // Stable, unique ids for ARIA associations
  const baseId = useId();
  const descId = `${baseId}-desc`;
  const errId = `${baseId}-error`;

  const isRequired = !!rules?.required;
  const isInvalid = !!fieldState.error;
  const editorTranslation = editorProps?.translation;

  // When RHF default values or `reset()` change the field value,
  // push it into the MDXEditor instance (prop is read once at mount).
  useEffect(() => {
    if (!editorRef.current) return;
    const next = (field.value as unknown as string) ?? "";
    // Avoid needless updates
    if (editorRef.current.getMarkdown?.() !== next) {
      editorRef.current.setMarkdown?.(next);
    }
  }, [field.value]);

  // If invalid after validation, move focus to the editor for quick correction
  useEffect(() => {
    if (isInvalid) editorRef.current?.focus?.();
  }, [isInvalid]);

  const describedBy = useMemo(() => {
    const ids: string[] = [];
    if (description) ids.push(descId);
    if (isInvalid) ids.push(errId);
    return ids.join(" ") || undefined;
  }, [description, isInvalid, descId, errId]);

  const translate = useCallback<Translation>(
    (key, defaultValue, interpolations = {}) => {
      if (key === "contentArea.editableMarkdown" && label) return label;
      if (editorTranslation) return editorTranslation(key, defaultValue, interpolations);

      return Object.entries(interpolations).reduce(
        (value, [name, replacement]) => value.replaceAll(`{{${name}}}`, String(replacement)),
        mdxEditorNorwegian[key] ?? defaultValue,
      );
    },
    [editorTranslation, label],
  );

  return (
    <div className={className}>
      {label && (
        <p className="mb-2 block text-sm">
          {label}
          {isRequired && (
            <span className="ml-1 text-danger-600" aria-hidden="true">
              *
            </span>
          )}
        </p>
      )}

      {description && (
        <p id={descId} className="mb-2 text-small text-default-500" role="note">
          {description}
        </p>
      )}

      {unreadable ? (
        <div className="space-y-2">
          <Notice status={"warning"}>
            Teksten inneholder formatering som redigeringsverktøyet ikke kan vise, så den vises som
            ren tekst (Markdown).
          </Notice>
          <textarea
            name={field.name}
            value={(field.value as unknown as string) ?? ""}
            onChange={(event) => field.onChange(event.target.value)}
            onBlur={field.onBlur}
            placeholder={placeholder}
            aria-label={label}
            aria-required={isRequired || undefined}
            aria-invalid={isInvalid || undefined}
            aria-describedby={describedBy}
            className="h-56 w-full rounded-lg border border-default-300 bg-default-100 p-3 font-mono text-sm sm:h-80"
          />
        </div>
      ) : (
        <Card
          role="group"
          className={isInvalid ? "border border-danger-500" : undefined}
          aria-describedby={describedBy}
        >
          <Card.Content className="w-full bg-default-100 p-0">
            <ForwardRefEditor
              ref={editorRef}
              markdown={(field.value as unknown as string) ?? ""}
              // The editor tidies the text it is given (spacing, list markers)
              // and reports that as a change; only the editor's own edits count,
              // or every page would open with "unsaved changes".
              onChange={(markdown, initialMarkdownNormalize) => {
                if (!initialMarkdownNormalize) field.onChange(markdown);
              }}
              onBlur={field.onBlur}
              placeholder={placeholder}
              aria-required={isRequired || undefined}
              aria-invalid={isInvalid || undefined}
              aria-describedby={describedBy}
              {...editorProps}
              translation={translate}
              onError={() => setUnreadable(true)}
            />
          </Card.Content>
        </Card>
      )}

      {isInvalid && (
        <Notice status={"danger"} id={errId}>
          {fieldState.error?.message}
        </Notice>
      )}
    </div>
  );
}
