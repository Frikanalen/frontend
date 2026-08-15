import { isAxiosError } from "axios";

const FALLBACK = "Noe gikk galt. Prøv igjen.";

/**
 * DRF reports failures in a handful of shapes: a top-level `detail` for
 * authentication and permission errors, a dict of field name to message list
 * for serializer validation, and a bare list for non-field errors.
 */
const formatResponseBody = (data: unknown): string | null => {
  if (typeof data === "string") return data.trim() || null;

  if (Array.isArray(data)) {
    const messages = data.filter((entry) => typeof entry === "string");
    return messages.length ? messages.join(" ") : null;
  }

  if (typeof data !== "object" || data === null) return null;

  const body = data as Record<string, unknown>;

  if (typeof body.detail === "string") return body.detail;

  // Serializer errors: { email: ["Denne e-posten er allerede i bruk."] }
  const fieldMessages = Object.values(body).flatMap((value) => {
    if (typeof value === "string") return [value];
    if (Array.isArray(value)) return value.filter((entry) => typeof entry === "string");
    return [];
  });

  return fieldMessages.length ? fieldMessages.join(" ") : null;
};

/**
 * Turns anything thrown by an orval/axios mutation into a sentence we can show
 * the user. Never throws, and never returns an empty string, so callers can
 * treat a truthy result as "there is something to display".
 */
export const formatApiError = (error: unknown): string => {
  if (isAxiosError(error)) {
    // No response at all means the request never completed: offline, DNS, CORS.
    if (!error.response) return error.message || FALLBACK;

    return formatResponseBody(error.response.data) ?? error.message ?? FALLBACK;
  }

  if (error instanceof Error) return error.message || FALLBACK;

  if (typeof error === "string") return error.trim() || FALLBACK;

  return FALLBACK;
};
