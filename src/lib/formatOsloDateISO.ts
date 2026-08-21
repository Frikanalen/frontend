import { formatISO } from "date-fns";
import { inOsloTime } from "@/lib/osloTime";

// For a given Date, return the ISO date string (YYYY-MM-DD) in the Europe/Oslo timezone
export const formatOsloDateISO = (inputDate: Date) =>
  formatISO(inOsloTime(inputDate), { representation: "date" });
