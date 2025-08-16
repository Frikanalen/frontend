import { Live } from "@/components/stream/live";
import { scheduleitemsList } from "@/generated/scheduleitems/scheduleitems";

export default async function Home() {
  const date = new Date().toISOString().split("T")[0];
  console.log(date);
  const { data } = await scheduleitemsList({ date });
  console.log(data);
  return (
    <main className="w-full max-w-5xl grow px-2">
      <Live schedule={data.results} />
    </main>
  );
}
