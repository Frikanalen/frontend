import { redirect } from "next/navigation";

export const dynamic = "force-dynamic"; // ensure Date() is evaluated at request time

export default function ScheduleIndex() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  redirect(`/schedule/${year}/${month}/${day}`);
}
