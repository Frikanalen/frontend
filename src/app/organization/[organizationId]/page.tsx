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
import { EditorInfo } from "@/app/organization/[organizationId]/EditorInfo";
import { Metadata } from "next";
import { ssrOrganizationRetrieve } from "@/generated/ssr/organization/organization";

type OrgPageProps = { params: Promise<{ organizationId: string }> };
export async function generateMetadata({ params }: OrgPageProps): Promise<Metadata> {
  const { organizationId } = await params;

  const { data: organization, status } = await ssrOrganizationRetrieve(organizationId, {
    cache: "no-store",
  });
  if (status !== 200)
    return {
      title: "Frikanalen",
    };

  return {
    title: `${organization.name} - Frikanalen`,
    description: `${organization.description} - Frikanalen`,
    authors: {
      name: organization.name,
    },
    openGraph: {
      url: `https://frikanalen.no/organization/${organization.id}`,
    },
  };
}

export default async function Page({ params }: OrgPageProps) {
  const { organizationId } = await params;
  const organizationIdNum = parseInt(organizationId);
  if (isNaN(organizationIdNum)) return notFound();

  const headers = await getCookiesFromRequest();
  const { data: organization } = await organizationRetrieve(organizationId, {
    headers,
  });
  const profile = await getUserOrNull(headers);

  const isAdmin = profileIsAdminOrMember(organizationIdNum, profile);

  if (!organization.fkmember && !isAdmin) return notFound();

  return (
    <main className="w-full max-w-5xl h-fit px-2">
      <div className="grow rounded-lg p-4 space-y-4">
        <OrgBlurb organization={organization} />
        {isAdmin && <AdminAlert organizationId={organizationId} />}
        <RecentVideos organization={organization} />
        <EditorInfo organization={organization} />
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
  </div>
);
