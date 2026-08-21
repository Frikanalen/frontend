import { Live } from "@/components/stream/live";
import { ScheduleitemRead } from "@/generated/frikanalenDjangoAPI.schemas";
import { ssrScheduleitemsList } from "@/generated/ssr/scheduleitems/scheduleitems";
import { formatOsloDateISO } from "../lib/formatOsloDateISO";

export const dynamic = "force-dynamic"; // ensure Date() is evaluated at request time

/**
 * Today's schedule for the now/next display, or an empty one if it can't be had.
 *
 * The live stream is the point of this page and the schedule beside it is
 * context, so a backend that is down, slow or unhappy costs us the listing
 * rather than the whole page. `surrounding` pulls in the items on either side of
 * the day, which is what keeps "next" populated late in the evening.
 */
const getScheduleForToday = async (): Promise<ScheduleitemRead[]> => {
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

export default async function Home() {
  const schedule = await getScheduleForToday();

  return (
    <main className="w-full max-w-5xl grow px-2">
      <Live schedule={schedule} />
    </main>
  );
}
