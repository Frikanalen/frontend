import { notFound } from "next/navigation";
import z from "zod";

/**
 * Django addresses every object by positive integer pk, and the router hands
 * us whatever the URL happened to contain. Coerce rather than reject strings:
 * a route param is a string by construction, so the string form is the only
 * form we ever see.
 */
const pk = z.coerce.number().int().positive();

export const OrganizationParams = z.object({ organizationId: pk });
export const SeriesParams = z.object({ seriesId: pk });
export const VideoParams = z.object({ videoId: pk });
export const OrganizationSeriesParams = OrganizationParams.extend({ seriesId: pk });

/**
 * Resolves and validates a route's params, rendering 404 for anything the
 * router matched but the API could never resolve.
 *
 * The 404 is the point: a ZodError thrown out of a server component escapes as
 * an unhandled error and renders the 500 page, which is the wrong answer for a
 * URL that simply names nothing. Callers get numbers back, so the raw string
 * stays out of scope and cannot reach the generated client by accident.
 */
export const parseParams = async <T extends z.ZodType>(
  schema: T,
  params: Promise<unknown>,
): Promise<z.infer<T>> => {
  const parsed = schema.safeParse(await params);
  if (!parsed.success) notFound();
  return parsed.data;
};
