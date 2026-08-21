import { ScheduleitemRead } from "@/generated/frikanalenDjangoAPI.schemas";
import { useState } from "react";
import { useHarmonicIntervalFn } from "react-use";

// An object with the current and future program. The two are independently
// absent: in a gap between programs there is no current one but there may well
// be a next one, and once the listing runs out - or never arrived - neither.
type ScheduleCursor = {
  currentProgram: ScheduleitemRead | undefined; // The currently running program, or undefined if nothing in the schedule covers now.
  nextProgram: ScheduleitemRead | undefined; // The next program to start, or undefined if the schedule ends here.
};

// Epoch milliseconds for an API timestamp. An unparseable one yields NaN, and
// every comparison against NaN is false, so a malformed item simply matches
// nothing - where date-fns' interval() would have thrown mid-render instead.
const timeOf = (timestamp: string) => new Date(timestamp).getTime();

// The program on air at the given instant. The interval is half-open, so an item
// ending exactly as the next one starts hands over rather than both matching.
const getCurrentProgram = (now: number, schedule: ScheduleitemRead[]) =>
  schedule.find(({ starttime, endtime }) => timeOf(starttime) <= now && now < timeOf(endtime));

// The program starting soonest after the given instant. The API orders by
// starttime, but picking out the earliest costs no more than trusting that.
const getNextProgram = (now: number, schedule: ScheduleitemRead[]) =>
  schedule.reduce<ScheduleitemRead | undefined>(
    (soonest, item) =>
      timeOf(item.starttime) > now &&
      (!soonest || timeOf(item.starttime) < timeOf(soonest.starttime))
        ? item
        : soonest,
    undefined,
  );

// Gets the current and upcoming program on the given schedule, according to the given date.
export const getScheduleCursor = (now: Date, schedule: ScheduleitemRead[]): ScheduleCursor => {
  const time = now.getTime();

  return {
    currentProgram: getCurrentProgram(time, schedule),
    nextProgram: getNextProgram(time, schedule),
  };
};

// Get the currently airing, and the upcoming program, according to user system clock.
// The clock is updated once per second, and all uses of this hook will trigger updates at the same time.
export const useScheduleCursor = (schedule: ScheduleitemRead[]): ScheduleCursor => {
  const [scheduleCursor, setScheduleCursor] = useState<ScheduleCursor>(() =>
    getScheduleCursor(new Date(), schedule),
  );

  // Gets the cursor at this instant; if it has moved on to different programs,
  // trigger a state update. Both slots are compared: during a gap in the
  // schedule the current program stays undefined while the next one advances.
  const update = () => {
    const cursor = getScheduleCursor(new Date(), schedule);

    setScheduleCursor((previous) =>
      cursor.currentProgram?.id === previous.currentProgram?.id &&
      cursor.nextProgram?.id === previous.nextProgram?.id
        ? previous
        : cursor,
    );
  };

  // update the current clock once per second. With useHarmonicInterval,
  // all effects with the same delay are triggered at the same time.
  useHarmonicIntervalFn(update, 1000);

  return scheduleCursor;
};
