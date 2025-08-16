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
    <div className="space-y-4 lg:p-10 flex flex-col lg:flex-row">
      <div className={"prose lg:max-w-sm"}>
        <h2 className={"mb-1!"}>Ny video</h2>
        <h3>for {organization.name}</h3>
        <p>
          Skriv inn navn og en kort beskrivelse for videoen her. Når videoen er opprettet, vil du
          bli bedt om å laste opp en originalfil for denne videoen.
        </p>
      </div>
      <VideoCreateForm
        className={"max-lg:max-w-xl w-full border-4 border-primary-100 ml-4 p-4 rounded-lg"}
        organizationId={parseInt(organizationId)}
        categories={categories.results}
      />
    </div>
  );
}
