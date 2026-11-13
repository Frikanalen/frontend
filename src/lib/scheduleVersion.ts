import { cacheLife } from "next/cache";
import { serverFetch } from "@/api/mutator/serverFetch";

/**
 * Django's schedule version: a token that changes whenever the schedule or a
 * grant does. Cached schedule data is keyed on it, so a change is picked up
 * within a few seconds on every frontend pod, while an unchanged schedule
 * costs Django one tiny request per pod every five seconds instead of a full
 * schedule per visitor.
 *
 * An API without the endpoint (or one that can't be reached) yields a fixed
 * token, which leaves the cached schedule to its own lifetime.
 */
export const getScheduleVersion = async (): Promise<string> => {
  "use cache";
  cacheLife({ stale: 5, revalidate: 5, expire: 60 });

  try {
    const { data, status } = await serverFetch<{ data: { version?: string }; status: number }>(
      "api/scheduleitems/version",
    );
    return status === 200 && data.version ? data.version : "unversioned";
  } catch (error) {
    console.error("Could not read the schedule version", error);
    return "unversioned";
  }
};
