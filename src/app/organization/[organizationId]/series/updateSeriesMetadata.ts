"use server";

import type { SeriesMetadataState } from "@/app/organization/[organizationId]/series/seriesMetadata";
import type { SeriesUpdateMutationBody } from "@/generated/series/series";
import { ssrSeriesPartialUpdate } from "@/generated/ssr/series/series";
import { getCookiesFromRequest } from "@/lib/getCookiesFromRequest";
import { refresh } from "next/cache";

export const updateSeriesMetadata = async (
  seriesId: number,
  _state: SeriesMetadataState,
  formData: FormData,
): Promise<SeriesMetadataState> => {
  const headers = await getCookiesFromRequest();
  const data = {
    name: String(formData.get("name") ?? ""),
    synopsis: String(formData.get("synopsis") ?? ""),
  } satisfies Pick<SeriesUpdateMutationBody, "name" | "synopsis">;
  const updateResponse = await ssrSeriesPartialUpdate(seriesId.toString(), data, {
    headers,
    cache: "no-store",
  });
  if (updateResponse.status !== 200) {
    return { status: "error", message: responseError(updateResponse.data) };
  }

  refresh();
  return { status: "success", message: "Serieopplysningene er lagret." };
};

const responseError = (data: unknown) => {
  if (typeof data !== "object" || data === null) return "Serien kunne ikke lagres.";

  const body = data as { detail?: unknown; errors?: unknown };
  if (typeof body.detail === "string") return body.detail;
  if (Array.isArray(body.errors)) {
    const messages = body.errors.flatMap((error) => {
      if (typeof error !== "object" || error === null) return [];
      const detail = (error as { detail?: unknown }).detail;
      return typeof detail === "string" ? [detail] : [];
    });
    if (messages.length) return messages.join(" ");
  }

  return "Serien kunne ikke lagres.";
};
