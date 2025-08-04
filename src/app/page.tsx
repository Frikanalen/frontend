import { Live } from "@/components/stream/live";
import { scheduleitemsList } from "@/generated/scheduleitems/scheduleitems";

export default async function Home() {
  const { data } = await scheduleitemsList();
  return <Live schedule={data.results} />;
}
