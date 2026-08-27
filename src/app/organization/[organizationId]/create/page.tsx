import { categoriesList } from "@/generated/categories/categories";
import { VideoCreateForm } from "@/app/organization/[organizationId]/create/VideoCreateForm";
import { getCookiesFromRequest } from "@/lib/getCookiesFromRequest";
import { organizationRetrieve } from "@/generated/organization/organization";
import { PageShell, PageShellBody } from "@/components/layout/PageShell";
import { seriesList } from "@/generated/series/series";
import { OrganizationParams, parseParamsOr404 } from "@/lib/routeParams";

export default async function Page({ params }: { params: Promise<{ organizationId: string }> }) {
  const { data: categories } = await categoriesList();
  const { organizationId } = await parseParamsOr404(OrganizationParams, params);

  const headers = await getCookiesFromRequest();
  const { data: organization } = await organizationRetrieve(organizationId, {
    headers,
  });
  const { data: series } = await seriesList(
    { organization: organizationId, limit: 100 },
    { headers },
  );

  return (
    <PageShell>
      <PageShellBody className={"space-y-4"}>
        <VideoCreateForm
          organizationId={organizationId}
          organizationName={organization.name}
          categories={categories.results}
          series={series.results}
        />
      </PageShellBody>
    </PageShell>
  );
}
