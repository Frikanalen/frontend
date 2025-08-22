"use client";

import { useEffect, useId, useMemo, useRef } from "react";
import {
  useController,
  type Control,
  type FieldPath,
  type FieldValues,
  type RegisterOptions,
} from "react-hook-form";
import { ForwardRefEditor } from "./ForwardRefEditor";
import type { MDXEditorMethods, MDXEditorProps } from "@mdxeditor/editor";
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
  const labelId = `${baseId}-label`;
  const descId = `${baseId}-desc`;
  const errId = `${baseId}-error`;

  const isRequired = !!rules?.required;
  const isInvalid = !!fieldState.error;

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

  return (
    <div className={className}>
      {label && (
        <label
          id={labelId}
          // HeroUI Text for consistent typography
          className="mb-2 block text-sm"
          // Associate to the editor region below
          htmlFor={baseId}
        >
          {label}
          {isRequired && (
            <span className="ml-1 text-danger-600" aria-hidden="true">
              *
            </span>
          )}
        </label>
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
        aria-labelledby={label ? labelId : undefined}
      >
        <CardBody className="w-full bg-default-100 p-0">
          <ForwardRefEditor
            ref={editorRef}
            className={"h-80"}
            markdown={(field.value as unknown as string) ?? ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            placeholder={placeholder}
            aria-required={isRequired || undefined}
            aria-invalid={isInvalid || undefined}
            aria-describedby={describedBy}
            {...editorProps}
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
