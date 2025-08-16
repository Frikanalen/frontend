import { organizationRetrieve } from "@/generated/organization/organization";
import { notFound } from "next/navigation";
import Markdown from "markdown-to-jsx";
import { Fragment } from "react";
import { Organization } from "@/generated/frikanalenDjangoAPI.schemas";
import { getCookiesFromRequest } from "@/app/profile/getCookiesFromRequest";
import { profileIsAdminOrMember } from "@/app/organization/[organizationId]/admin/profileIsAdminOrMember";
import { AdminAlert } from "@/app/organization/[organizationId]/AdminAlert";
import { getUserOrNull } from "@/app/getUserOrNull";
import { RecentVideos } from "@/app/organization/[organizationId]/RecentVideos";

export default async function Page({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  const headers = await getCookiesFromRequest();
  const { data: organization } = await organizationRetrieve(organizationId, {
    headers,
  });
  const profile = await getUserOrNull(headers);

  const isAdmin = profileIsAdminOrMember(organizationId, profile);

  if (!organization.fkmember && !isAdmin) return notFound();

  return (
    <main className="w-full max-w-5xl h-fit px-2">
      <div className="grow rounded-lg p-4 space-y-4">
        <OrgBlurb organization={organization} />
        {isAdmin && <AdminAlert organizationId={organizationId} />}
        <RecentVideos organization={organization} />
      </div>
    </main>
  );
}

const OrgBlurb = ({ organization }: { organization: Organization }) => (
  <div className={"prose dark:prose-invert max-w-2xl"}>
    <h2>{organization.name}</h2>
    <Markdown options={{ wrapper: Fragment }}>
      {organization.description || "*organisasjonen har ikke lagt opp en beskrivelse av seg selv*"}
    </Markdown>
    <p>Redaktør: {organization.editorName}</p>
  </div>
);
