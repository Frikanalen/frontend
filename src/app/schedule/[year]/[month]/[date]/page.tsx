import { Suspense } from "react";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { ssrScheduleitemsList } from "@/generated/ssr/scheduleitems/scheduleitems";
import { ScheduleitemRead } from "@/generated/frikanalenDjangoAPI.schemas";
import { ScheduleNavBar } from "@/app/schedule/ScheduleNavBar";
import { ScheduleItemList } from "@/app/schedule/ScheduleItemView";
import { ScheduleWeek } from "@/app/schedule/ScheduleWeek";
import { ScheduleDateParams, parseParamsOr404 } from "@/lib/routeParams";
import { formatOsloDateISO } from "@/lib/formatOsloDateISO";
import { scheduleGeneration } from "@/lib/scheduleChanges";

type ScheduleParams = Promise<{ year: string; month: string; date: string }>;

/**
 * One day's schedule, shared by every visitor until Django says the schedule
 * changed (see scheduleChanges) or a minute passes: the same day is asked for
 * by everyone who opens the schedule today. Passing `generation` makes it
 * part of the cache key.
 */
const fetchScheduleDay = async (date: string, generation: string): Promise<ScheduleitemRead[]> => {
  "use cache";
  cacheLife("minutes");
  cacheTag("schedule", `schedule-generation:${generation}`);

  const { data, status } = await ssrScheduleitemsList({ date });
  if (status !== 200) throw new Error(`Schedule for ${date}: the API answered ${status}`);
  return data.results ?? [];
};

/**
 * The week strip, with today marked. Cached like the day itself: working out
 * the week reads the clock, and a day's page should be kept and reused for a
 * minute rather than rendered again for every visitor just to ask it.
 */
const Week = async ({ year, month, date }: { year: string; month: string; date: string }) => {
  "use cache";
  cacheLife("minutes");
  return (
    <ScheduleWeek year={year} month={month} date={date} today={formatOsloDateISO(new Date())} />
  );
};

const DayNavigation = async ({ params }: { params: ScheduleParams }) => {
  const { year, month, date } = await parseParamsOr404(ScheduleDateParams, params);
  return (
    <>
      <ScheduleNavBar year={year} month={month} date={date} />
      <Week year={year} month={month} date={date} />
    </>
  );
};

const DayItems = async ({ params }: { params: ScheduleParams }) => {
  const { year, month, date } = await parseParamsOr404(ScheduleDateParams, params);
  const items = await fetchScheduleDay(`${year}-${month}-${date}`, scheduleGeneration());
  return <ScheduleItemList items={items} />;
};

/**
 * The schedule for a day. The frame and the sidebar are the same for every
 * day and served as the static shell; the day itself streams in, from a cache
 * shared by all visitors.
 */
export default function Schedule({ params }: { params: ScheduleParams }) {
  return (
    <main className="mx-auto flex w-full max-w-7xl grow flex-col gap-8 px-4 pt-10 sm:px-6">
      <Suspense fallback={<div className="min-h-28" />}>
        <DayNavigation params={params} />
      </Suspense>
      <div className="grid grid-cols-1 items-start gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Suspense fallback={<div className="min-h-96" />}>
          <DayItems params={params} />
        </Suspense>
        <aside className="flex flex-col gap-2 bg-background p-6">
          <h2 className="text-lg font-bold">Hvem bestemmer hva som sendes?</h2>
          <p className="text-default-800">
            Medlemsorganisasjonene setter selv opp programmene i sendetiden sin. Planen låses en uke
            i forveien, så seere og programoversikter vet hva som kommer.
          </p>
          <Link
            className="self-start py-1 font-semibold text-primary-700 hover:underline"
            href="/about"
          >
            Om Frikanalen →
          </Link>
        </aside>
      </div>
    </main>
  );
}
