"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useVideosDestroy } from "@/generated/videos/videos";
import { formatApiError } from "@/lib/formatApiError";

/**
 * Deleting a video from one of the organization's own lists.
 *
 * Shared by both of them because deletion is the same act whichever list it
 * is started from, and because the two lists are each other's neighbours: a
 * video that was never imported sits in one, and every other video in the
 * other, so a deletion has to invalidate both. Invalidating the whole
 * `/api/videos` prefix does that without either list having to know the
 * other's filters.
 *
 * The confirmation is a `window.confirm` rather than a modal on purpose: this
 * is destructive and rare, and the browser's own dialog is the one nobody
 * dismisses by reflex.
 */
export const useVideoDeletion = () => {
  const queryClient = useQueryClient();
  const destroy = useVideosDestroy();
  const [error, setError] = useState<string>();

  const remove = async (id: number, name: string, confirmation: string) => {
    if (!window.confirm(confirmation)) return;

    setError(undefined);
    try {
      await destroy.mutateAsync({ id });
      await queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
    } catch (cause) {
      setError(formatApiError(cause));
    }
  };

  return {
    remove,
    /** True only for the row being deleted, so one spinner shows, not all. */
    isRemoving: (id: number) => destroy.isPending && destroy.variables?.id === id,
    error,
  };
};
