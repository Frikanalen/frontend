import { cache } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { connection } from "next/server";
import { ScheduleitemRead } from "@/generated/frikanalenDjangoAPI.schemas";
import { ssrScheduleitemsList } from "@/generated/ssr/scheduleitems/scheduleitems";
import { formatOsloDateISO } from "@/lib/formatOsloDateISO";
import { scheduleGeneration } from "@/lib/scheduleChanges";

/**
 * One day's schedule with the items on either side, shared by every visitor
 * until Django says the schedule changed (see scheduleChanges) or a minute passes; passing `generation`
 * makes it part of the cache key. Throws rather than returning an empty day,
 * because a throw is never cached: a backend hiccup then costs one page view,
 * not a minute of them.
 */
const fetchScheduleAround = async (
  date: string,
  generation: string,
): Promise<ScheduleitemRead[]> => {
  "use cache";
  cacheLife("minutes");
  cacheTag("schedule", `schedule-generation:${generation}`);

  const { data, status } = await ssrScheduleitemsList({ date, surrounding: true });
  if (status !== 200) throw new Error(`the API answered ${status}`);
  return data.results ?? [];
};

/**
 * Today's schedule for the front page's now/next display, or an empty one if it
 * can't be had.
 *
 * The live stream is the point of that page and the schedule beside it is
 * context, so a backend that is down, slow or unhappy costs us the listing
 * rather than the whole page. `surrounding` pulls in the items on either side of
 * the day, which is what keeps "next" populated late in the evening.
 *
 * "Today" is the request's, not the build's, hence connection(): whatever
 * awaits this streams in behind <Suspense>. Shared within a render, since the
 * front page shows the schedule in two places.
 */
export const getScheduleForToday = cache(async (): Promise<ScheduleitemRead[]> => {
  await connection();
  try {
    return await fetchScheduleAround(formatOsloDateISO(new Date()), scheduleGeneration());
  } catch (error) {
    console.error("Could not load the front page schedule", error);
    return [];
  }
});
