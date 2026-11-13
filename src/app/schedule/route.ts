import { redirect } from "next/navigation";
import { connection } from "next/server";

const formatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Oslo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// Redirect to today's schedule, in [year]/[month]/[date]/page.tsx.
export async function GET() {
  // Today, as of this request, not as of the build.
  await connection();
  const [year, month, day] = formatter.format(new Date()).split("-");
  redirect(`/schedule/${year}/${month}/${day}`);
}
