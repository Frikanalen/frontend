import { ScheduleitemRead } from "@/generated/frikanalenDjangoAPI.schemas";
import { ssrScheduleitemsList } from "@/generated/ssr/scheduleitems/scheduleitems";
import { formatOsloDateISO } from "@/lib/formatOsloDateISO";

/**
 * Today's schedule for the front page's now/next display, or an empty one if it
 * can't be had.
 *
 * The live stream is the point of that page and the schedule beside it is
 * context, so a backend that is down, slow or unhappy costs us the listing
 * rather than the whole page. `surrounding` pulls in the items on either side of
 * the day, which is what keeps "next" populated late in the evening.
 */
export const getScheduleForToday = async (): Promise<ScheduleitemRead[]> => {
  try {
    const { data, status } = await ssrScheduleitemsList(
      { date: formatOsloDateISO(new Date()), surrounding: true },
      { cache: "no-store" },
    );

    if (status !== 200) {
      console.error(`Could not load the front page schedule: the API answered ${status}`);
      return [];
    }

    return data.results ?? [];
  } catch (error) {
    console.error("Could not load the front page schedule", error);
    return [];
  }
};
