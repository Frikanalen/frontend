import { organizationRetrieve } from "@/generated/organization/organization";
import { notFound } from "next/navigation";
import Markdown from "markdown-to-jsx";
import { Fragment } from "react";
import { Organization } from "@/generated/frikanalenDjangoAPI.schemas";
import { videosList } from "@/generated/videos/videos";
import { getCookiesFromRequest } from "@/app/profile/getCookiesFromRequest";
import { profileIsAdminOrMember } from "@/app/organization/[organizationId]/admin/profileIsAdminOrMember";
import { AdminAlert } from "@/app/organization/[organizationId]/AdminAlert";
import { VideoVerticalList } from "@/app/organization/[organizationId]/VideoVerticalList";
import { getUserOrNull } from "@/app/getUserOrNull";

const RecentVideos = async ({
  organization,
}: {
  organization: Organization;
}) => {
  const res = await videosList({ organization: organization.id, limit: 10 });
  const data = res.data;
  if (res.status != 200) throw new Error(res.statusText);

  return (
    <section>
      <div className="bg-content2 text-content2-foreground rounded-lg p-4">
        <h3 className={"pb-2 text-lg font-bold"}>
          Nyeste videoer for {organization.name}
        </h3>
        <VideoVerticalList videos={data.results} />
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
  const headers = await getCookiesFromRequest();
  const { data: organization } = await organizationRetrieve(organizationId, {
    headers,
  });
  const profile = await getUserOrNull(headers);

  const isAdmin = profileIsAdminOrMember(organizationId, profile);

  if (!organization.fkmember) return notFound();

  return (
    <main className="w-full max-w-5xl h-fit">
      <div className="flex flex-row gap-4">
        <div className="bg-content2 grow text-content2-foreground rounded-lg p-4 space-y-4">
          <h1 className={"text-xl"}>{organization.name}</h1>
          <h2>Redaktør {organization.editorName}</h2>
          <div className={"prose dark:prose-invert"}>
            <Markdown options={{ wrapper: Fragment }}>
              {organization.description ||
                "*organisasjonen har ikke lagt opp en beskrivelse av seg selv*"}
            </Markdown>
          </div>
        </div>
        <div className={"w-sm space-y-4"}>
          {isAdmin && <AdminAlert organizationId={organizationId} />}
          <RecentVideos organization={organization} />
        </div>
      </div>
    </main>
  );
}
