import { scheduleitemsList } from "@/generated/scheduleitems/scheduleitems";
import { ScheduleUI } from "@/app/schedule/ScheduleNavBar";

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
    <section className="">
      <ScheduleUI year={year} month={month} date={date} items={results} />
    </section>
  );
}
