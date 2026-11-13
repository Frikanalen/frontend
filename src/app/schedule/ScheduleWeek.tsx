import Link from "next/link";
import cx from "classnames";
import { addDays, format, startOfWeek } from "date-fns";
import { nb } from "date-fns/locale/nb";
import { TZDate } from "@date-fns/tz/date";
import { OSLO_TIME_ZONE } from "@/lib/osloTime";

/**
 * The week around the day on show, one link per day. A schedule is browsed a
 * day at a time, so the days are the page's main navigation; the arrows and
 * the date picker above are for going further.
 */
export const ScheduleWeek = ({
  year,
  month,
  date,
  today,
}: {
  year: string;
  month: string;
  date: string;
  /** Today in Oslo, YYYY-MM-DD; passed in so the page decides how fresh it is. */
  today: string;
}) => {
  const selected = new TZDate(parseInt(year), parseInt(month) - 1, parseInt(date), OSLO_TIME_ZONE);
  const monday = startOfWeek(selected, { weekStartsOn: 1 });

  return (
    <nav aria-label="Ukedager" className="overflow-x-auto">
      <ul className="flex min-w-[36rem] gap-0.5">
        {Array.from({ length: 7 }, (_, index) => {
          const day = addDays(monday, index);
          const iso = format(day, "yyyy-MM-dd");
          const isSelected = iso === format(selected, "yyyy-MM-dd");
          return (
            <li className="flex-1" key={iso}>
              <Link
                aria-current={isSelected ? "date" : undefined}
                className={cx(
                  "block px-3 py-2.5 outline-focus focus-visible:outline-2",
                  isSelected
                    ? "bg-stage text-stage-foreground"
                    : "bg-background text-foreground hover:bg-default-100",
                )}
                // Evening is where most of the schedule is, so that is the
                // part of the day a newly opened day starts on.
                href={`/schedule/${format(day, "yyyy/MM/dd")}#p2`}
              >
                <span
                  className={cx(
                    "block text-sm",
                    iso === today
                      ? isSelected
                        ? "font-semibold text-brand-leaf"
                        : "font-semibold text-primary-700"
                      : isSelected
                        ? "text-stage-muted"
                        : "text-default-600",
                  )}
                >
                  {iso === today ? "i dag" : format(day, "EEE", { locale: nb }).replace(".", "")}
                </span>
                <span className="block text-xl font-bold">{format(day, "d.")}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
