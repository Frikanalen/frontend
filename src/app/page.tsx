import { Live } from "@/components/stream/live";
import { getScheduleForToday } from "@/app/getScheduleForToday";
import Link from "next/link";

export const dynamic = "force-dynamic"; // ensure Date() is evaluated at request time

export default async function Home() {
  const schedule = await getScheduleForToday();

  return (
    <main className="w-full max-w-5xl grow px-2">
      <aside aria-label="Frikanalen i protest" className="mb-6">
        <Link
          href="/protest"
          className="block rounded-lg bg-black p-5 text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
        >
          <p className="text-lg font-bold">
            Frikanalen går i svart i protest mot udemokratisk overtakelse av kanalen
          </p>
          <p className="mt-2 underline underline-offset-4">Les redegjørelsen →</p>
        </Link>
      </aside>
      <Live schedule={schedule} />
    </main>
  );
}
