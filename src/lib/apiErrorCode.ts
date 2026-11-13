import { isAxiosError } from "axios";

/**
 * The drf-standardized-errors `code` the API gave for one field, if any.
 * Lets a form react to a specific answer (say, `otp_required` on `otp`)
 * instead of only printing it.
 */
export const apiErrorCode = (error: unknown, attr: string): string | null => {
  if (!isAxiosError(error)) return null;
  const errors = (error.response?.data as { errors?: unknown } | undefined)?.errors;
  if (!Array.isArray(errors)) return null;
  const match = errors.find(
    (entry): entry is { attr: string; code: string } =>
      typeof entry === "object" && entry !== null && (entry as { attr?: unknown }).attr === attr,
  );
  return match?.code ?? null;
};
