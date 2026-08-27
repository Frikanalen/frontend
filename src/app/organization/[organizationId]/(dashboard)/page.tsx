import { organizationRetrieve } from "@/generated/organization/organization";
import { notFound } from "next/navigation";
import Markdown from "markdown-to-jsx";
import { Fragment } from "react";
import { Organization } from "@/generated/frikanalenDjangoAPI.schemas";
import { getCookiesFromRequest } from "@/lib/getCookiesFromRequest";
import { profileIsAdminOrMember } from "@/app/organization/[organizationId]/admin/profileIsAdminOrMember";
import { AdminAlert } from "@/app/organization/[organizationId]/AdminAlert";
import { getUserOrNull } from "@/app/getUserOrNull";
import { RecentVideos } from "@/app/organization/[organizationId]/RecentVideos";
import { OrganizationSeries } from "@/app/organization/[organizationId]/OrganizationSeries";
import { EditorInfo } from "@/app/organization/[organizationId]/EditorInfo";
import { ArchiveSearch } from "@/app/video/ArchiveSearch";
import { Metadata } from "next";
import { ssrOrganizationRetrieve } from "@/generated/ssr/organization/organization";
import { OrganizationParams, parseParams } from "@/lib/routeParams";

type OrgPageProps = { params: Promise<{ organizationId: string }> };
export async function generateMetadata({ params }: OrgPageProps): Promise<Metadata> {
  const { organizationId } = await parseParams(OrganizationParams, params);

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
  const { organizationId } = await parseParams(OrganizationParams, params);

  const headers = await getCookiesFromRequest();
  const { data: organization } = await organizationRetrieve(organizationId, {
    headers,
  });
  const profile = await getUserOrNull(headers);

  const isAdmin = profileIsAdminOrMember(organizationId, profile);

  if (!organization.fkmember && !isAdmin) return notFound();

  // No <main> of its own: organization/layout.tsx already provides the page's
  // one main landmark, and nesting a second inside it leaves the document
  // with two.
  return (
    <div className="grow rounded-lg p-4 space-y-6">
      <OrgBlurb organization={organization} />
      {isAdmin && <AdminAlert organizationId={organizationId} />}
      <OrganizationSeries organizationId={organization.id} />
      <ArchiveSearch scope={{ id: organization.id, name: organization.name }} />
      <RecentVideos organization={organization} />
      <EditorInfo organization={organization} />
    </div>
  );
}

const OrgBlurb = ({ organization }: { organization: Organization }) => (
  <div className={"prose dark:prose-invert max-w-2xl"}>
    <h1>{organization.name}</h1>
    <Markdown options={{ wrapper: Fragment }}>
      {organization.description || "*organisasjonen har ikke lagt opp en beskrivelse av seg selv*"}
    </Markdown>
  </div>
);
