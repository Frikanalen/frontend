import { scheduleitemsList } from "@/generated/scheduleitems/scheduleitems";

import { ScheduleNavBar } from "@/app/schedule/ScheduleNavBar";
import { ScheduleItemList } from "@/app/schedule/ScheduleItemView";

export const dynamic = "force-dynamic"; // ensure Date() is evaluated at request time

export default async function Schedule({
  params,
}: {
  params: Promise<{ year: string; month: string; date: string }>;
}) {
  const { year, month, date } = await params;
  const data = await scheduleitemsList({ date: `${year}-${month}-${date}` });

  const results = data.data.results;
  if (!results) return null;
  return (
    <main className="w-full max-w-5xl grow px-2">
      <section className="bg-background rounded-md shadow-lg p-4">
        <ScheduleNavBar year={year} month={month} date={date} />
        <ScheduleItemList items={results} />
      </section>
    </main>
  );
}
