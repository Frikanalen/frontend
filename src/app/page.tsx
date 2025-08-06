import { Live } from "@/components/stream/live";
import { scheduleitemsList } from "@/generated/scheduleitems/scheduleitems";

export default async function Home() {
  const { data } = await scheduleitemsList();
  return (
    <main className="w-full max-w-5xl grow px-2">
      <Live schedule={data.results} />
    </main>
  );
}
