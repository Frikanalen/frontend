import { Live } from "@/components/stream/live";
import { getScheduleForToday } from "@/app/getScheduleForToday";

export const dynamic = "force-dynamic"; // ensure Date() is evaluated at request time

export default async function Home() {
  const schedule = await getScheduleForToday();

  return (
    <main className="w-full max-w-5xl grow px-2">
      <Live schedule={schedule} />
    </main>
  );
}
