import { categoriesList } from "@/generated/categories/categories";
import { VideoCreateForm } from "@/app/organization/[organizationId]/create/VideoCreateForm";
import { getCookiesFromRequest } from "@/app/profile/getCookiesFromRequest";
import { organizationRetrieve } from "@/generated/organization/organization";

export default async function Page({ params }: { params: Promise<{ organizationId: string }> }) {
  const { data: categories } = await categoriesList();
  const { organizationId } = await params;

  const headers = await getCookiesFromRequest();
  const { data: organization } = await organizationRetrieve(organizationId, {
    headers,
  });

  return (
    <div className="space-y-4">
      <div className={"prose"}>
        <h2>Ny video for {organization.name}</h2>
        <p>Skriv inn navn og en kort beskrivelse for videoen her.</p>
      </div>
      <VideoCreateForm organizationId={parseInt(organizationId)} categories={categories.results} />
    </div>
  );
}
