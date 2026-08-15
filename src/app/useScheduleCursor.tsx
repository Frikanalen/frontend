import { ScheduleitemRead } from "@/generated/frikanalenDjangoAPI.schemas";
import { interval, isWithinInterval } from "date-fns";
import { useState } from "react";
import { useHarmonicIntervalFn } from "react-use";

// An object with the current and future program.
type ScheduleCursor = {
  currentProgram: ScheduleitemRead | undefined; // The currently running program, or undefined if we fail to derive one.
  nextProgram: ScheduleitemRead | undefined; // The next program, or undefined if we fail to derive one.
};

// Gets the index of the current program in the given schedule item list, or -1 if not found.
export const getCurrentProgramIndex = (
  now: Date,
  schedule: ScheduleitemRead[],
) =>
  schedule.findIndex((item) =>
    isWithinInterval(now, interval(item.starttime, item.endtime)),
  );

// Gets the upcoming program on the given schedule, according to given date.
const getScheduleCursor = (
  now: Date,
  schedule: ScheduleitemRead[],
): ScheduleCursor => ({
  currentProgram: schedule.at(getCurrentProgramIndex(now, schedule)),
  nextProgram: schedule.at(getCurrentProgramIndex(now, schedule) + 1),
});

// Get the currently airing, and the upcoming program, according to user system clock.
// The clock is updated once per second, and all uses of this hook will trigger updates at the same time.
export const useScheduleCursor = (
  schedule: ScheduleitemRead[],
): ScheduleCursor => {
  const [scheduleCursor, setScheduleCursor] = useState<ScheduleCursor>(() =>
    getScheduleCursor(new Date(), schedule),
  );

  // Gets the current program at this instant; if the current program has changed,
  // trigger a state update.
  const update = () => {
    const cursor = getScheduleCursor(new Date(), schedule);
    if (cursor.currentProgram?.id != scheduleCursor.currentProgram?.id)
      setScheduleCursor(cursor);
  };

  // update the current clock once per second. With useHarmonicInterval,
  // all effects with the same delay are triggered at the same time.
  useHarmonicIntervalFn(update, 1000);

  return scheduleCursor;
};
