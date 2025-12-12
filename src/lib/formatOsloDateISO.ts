import { formatISO } from "date-fns";
import { TZDate } from "react-day-picker";

// For a given Date, return the ISO date string (YYYY-MM-DD) in the Europe/Oslo timezone
export const formatOsloDateISO = (inputDate: Date) =>
  formatISO(new TZDate(inputDate, "Europe/Oslo"), { representation: "date" });
