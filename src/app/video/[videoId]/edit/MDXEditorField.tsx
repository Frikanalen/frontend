"use client";

import { useCallback, useEffect, useId, useMemo, useRef } from "react";
import {
  useController,
  type Control,
  type FieldPath,
  type FieldValues,
  type RegisterOptions,
} from "react-hook-form";
import { ForwardRefEditor } from "./ForwardRefEditor";
import type { MDXEditorMethods, MDXEditorProps, Translation } from "@mdxeditor/editor";
import { Card, CardBody } from "@heroui/react";
import { Alert } from "@heroui/alert";

type EditorPassThrough = Omit<
  MDXEditorProps,
  "markdown" | "onChange" | "onBlur" | "ref" | "placeholder"
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
        defaultValue,
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

      <Card
        role="group"
        className={isInvalid ? "border border-danger-500" : undefined}
        aria-describedby={describedBy}
      >
        <CardBody className="w-full bg-default-100 p-0">
          <ForwardRefEditor
            ref={editorRef}
            markdown={(field.value as unknown as string) ?? ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            placeholder={placeholder}
            aria-required={isRequired || undefined}
            aria-invalid={isInvalid || undefined}
            aria-describedby={describedBy}
            {...editorProps}
            translation={translate}
          />
        </CardBody>
      </Card>

      {isInvalid && (
        <Alert color={"danger"} id={errId}>
          {fieldState.error?.message}
        </Alert>
      )}
    </div>
  );
}
