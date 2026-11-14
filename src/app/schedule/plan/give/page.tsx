import { redirect } from "next/navigation";

// Per-visitor: rendered on request, without a static shell of its own.
export const instant = false;

/** Giving airtime moved onto the week page, where the free time is. */
export default function Page() {
  redirect("/schedule/plan");
}
