import { Organization } from "@/generated/frikanalenDjangoAPI.schemas";
import { videosList } from "@/generated/videos/videos";
import { VideoHorizontalList } from "@/app/organization/[organizationId]/VideoHorizontalList";

export const RecentVideos = async ({ organization }: { organization: Organization }) => {
  const res = await videosList({ organization: organization.id, limit: 10 });
  const data = res.data;
  if (res.status != 200) throw new Error(res.statusText);

  return (
    <section>
      <div className="bg-content2 text-content2-foreground rounded-lg p-4">
        <h3 className={"pb-2 text-lg font-bold"}>Nyeste videoer for {organization.name}</h3>
        <VideoHorizontalList videos={data.results} />
      </div>
    </section>
  );
};
