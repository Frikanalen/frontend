import { Live } from "@/components/stream/live";
import { scheduleitemsList } from "@/generated/scheduleitems/scheduleitems";
import { formatOsloDateISO } from "../lib/formatOsloDateISO";

export default async function Home() {
  const date = formatOsloDateISO(new Date());
  const { data } = await scheduleitemsList({ date });

  return (
    <main className="w-full max-w-5xl grow px-2">
      <Live schedule={data.results} />
    </main>
  );
}
