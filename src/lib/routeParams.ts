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
 * A schedule day, as the three padded segments the URL carries.
 *
 * Checked as a whole rather than segment by segment, because the segments only
 * mean anything together: "2026-02-31" is three plausible numbers that name no
 * day, and Date rolls it forward to 3 March rather than rejecting it, so the
 * round trip through toISOString is what catches it.
 *
 * The segments stay strings. Zero padding is what both the API's date filter
 * and the navigation links either side of the day want, and dropping it here
 * only means putting it back twice.
 */
export const ScheduleDateParams = z
  .object({
    year: z.string().regex(/^\d{4}$/),
    month: z.string().regex(/^\d{2}$/),
    date: z.string().regex(/^\d{2}$/),
  })
  .refine(({ year, month, date }) => {
    const day = `${year}-${month}-${date}`;
    const parsed = new Date(`${day}T00:00:00Z`);

    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(day);
  });

/**
 * Resolves and validates a route's params, rendering 404 for anything the
 * router matched but the API could never resolve.
 *
 * The 404 is the point: a ZodError thrown out of a server component escapes as
 * an unhandled error and renders the 500 page, which is the wrong answer for a
 * URL that simply names nothing. Callers get numbers back, so the raw string
 * stays out of scope and cannot reach the generated client by accident.
 */
export const parseParamsOr404 = async <T extends z.ZodType>(
  schema: T,
  params: Promise<unknown>,
): Promise<z.infer<T>> => {
  const parsed = schema.safeParse(await params);
  if (!parsed.success) notFound();
  return parsed.data;
};
