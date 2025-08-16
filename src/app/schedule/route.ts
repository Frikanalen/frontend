import { redirect } from "next/navigation";

export const runtime = "edge";

const formatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Oslo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// Redirect to today's schedule, in [year]/[month]/[date]/page.tsx.
export function GET() {
  const [year, month, day] = formatter.format(new Date()).split("-");
  redirect(`/schedule/${year}/${month}/${day}`);
}
