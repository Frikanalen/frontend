import { organizationRetrieve } from "@/generated/organization/organization";
import { notFound } from "next/navigation";
import Markdown from "markdown-to-jsx";
import { Fragment } from "react";
import { Organization } from "@/generated/frikanalenDjangoAPI.schemas";
import { videosList } from "@/generated/videos/videos";
import { VideoHorizontalList } from "@/app/organization/[organizationId]/VideoHorizontalList";

const RecentVideos = async ({
  organization,
}: {
  organization: Organization;
}) => {
  const res = await videosList({ organization: organization.id, limit: 15 });
  const data = res.data;
  if (res.status != 200) throw new Error(res.statusText);

  return (
    <section>
      <div className="bg-content2 text-content2-foreground rounded-lg p-4">
        <h3>Nyeste videoer for {organization.name}</h3>
        <VideoHorizontalList videos={data.results} />
      </div>
    </section>
  );
};
export default async function Page({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  const res = await organizationRetrieve(organizationId);
  const organization = res.data;
  if (!organization.fkmember) return notFound();
  return (
    <section className={"space-y-4"}>
      <div className="bg-content2 text-content2-foreground rounded-lg p-4 max-w-lg">
        <h1 className={"text-xl"}>{organization.name}</h1>
        <h2>Redaktør {organization.editorName}</h2>
        <div className={"prose dark:prose-invert"}>
          <Markdown options={{ wrapper: Fragment }}>
            {organization.description ||
              "*organisasjonen har ikke lagt opp en beskrivelse av seg selv*"}
          </Markdown>
        </div>
      </div>
      <RecentVideos organization={organization} />
    </section>
  );
}
