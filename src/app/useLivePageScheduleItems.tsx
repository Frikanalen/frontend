import { ScheduleitemsListParams } from "@/generated/frikanalenDjangoAPI.schemas";
// import { add, roundToNearestHours, sub } from "date-fns";
import { useScheduleitemsList } from "@/generated/scheduleitems/scheduleitems";

/**
 * Gets the schedule data necessary to render the front page "now and next" display.
 *
 * Note that it is important that now is not hooked right to "new Date()", as it will re-query and
 * re-render the component every time the value of "now" changes. Use support functions like
 * [use20PPM] to get a stable value.
 *
 */
export const useLivePageScheduleItems = () => {
  // We round it slightly to make caching a little easier
  const livePageScheduleItems: ScheduleitemsListParams = {
    // starttime_after: roundToNearestHours(sub(now, { hours: 5 })).toISOString(),
    // starttime_before: roundToNearestHours(add(now, { hours: 8 })).toISOString(),
    ordering: "starttime",
  };

  return useScheduleitemsList(livePageScheduleItems);
};
