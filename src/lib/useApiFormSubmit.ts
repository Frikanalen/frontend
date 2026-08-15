"use client";
import { useCallback, useState } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import { formatApiError } from "@/lib/formatApiError";

/**
 * Wraps `handleSubmit` so that a rejected mutation becomes a message on screen
 * instead of an unhandled rejection, and so every form gets consistent
 * double-submit protection via `isSubmitting`.
 */
export const useApiFormSubmit = <T extends FieldValues>(
  form: UseFormReturn<T>,
  onValid: (_data: T) => Promise<unknown>,
) => {
  const [error, setError] = useState<string | null>(null);

  const onSubmit = form.handleSubmit(async (data) => {
    setError(null);
    try {
      await onValid(data);
    } catch (cause) {
      setError(formatApiError(cause));
    }
  });

  const clearError = useCallback(() => setError(null), []);

  return { onSubmit, error, clearError, isSubmitting: form.formState.isSubmitting };
};
