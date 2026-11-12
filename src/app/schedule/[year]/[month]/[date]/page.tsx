import { scheduleitemsList } from "@/generated/scheduleitems/scheduleitems";

import { ScheduleNavBar } from "@/app/schedule/ScheduleNavBar";
import { ScheduleItemList } from "@/app/schedule/ScheduleItemView";
import { ScheduleWeek } from "@/app/schedule/ScheduleWeek";
import { ScheduleDateParams, parseParamsOr404 } from "@/lib/routeParams";
import Link from "next/link";

export const dynamic = "force-dynamic"; // ensure Date() is evaluated at request time

export default async function Schedule({
  params,
}: {
  params: Promise<{ year: string; month: string; date: string }>;
}) {
  const { year, month, date } = await parseParamsOr404(ScheduleDateParams, params);
  const data = await scheduleitemsList({ date: `${year}-${month}-${date}` });

  const results = data.data.results;
  if (!results) return null;
  return (
    <main className="mx-auto flex w-full max-w-7xl grow flex-col gap-8 px-4 pt-10 sm:px-6">
      <ScheduleNavBar year={year} month={month} date={date} />
      <ScheduleWeek year={year} month={month} date={date} />
      <div className="grid grid-cols-1 items-start gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <ScheduleItemList items={results} />
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
