import { categoriesList } from "@/generated/categories/categories";
import { VideoCreateForm } from "@/app/organization/[organizationId]/create/VideoCreateForm";
import { getCookiesFromRequest } from "@/app/profile/getCookiesFromRequest";
import { organizationRetrieve } from "@/generated/organization/organization";
import { ModalIshPrototype, ModalIshPrototypeBody } from "@/app/profile/ModalIshPrototype";
import { CreateFlowSteps } from "@/components/videoCreateFlow/CreateFlowSteps";

export default async function Page({ params }: { params: Promise<{ organizationId: string }> }) {
  const { data: categories } = await categoriesList();
  const { organizationId } = await params;

  const headers = await getCookiesFromRequest();
  const { data: organization } = await organizationRetrieve(organizationId, {
    headers,
  });

  return (
    <ModalIshPrototype>
      <ModalIshPrototypeBody className={"space-y-4"}>
        <CreateFlowSteps current="details" />
        <div className={"prose dark:prose-invert"}>
          <h2 className={"mb-1!"}>Ny video</h2>
          <h3>for {organization.name}</h3>
          <p>
            Skriv inn navn og en kort beskrivelse for videoen her. Når videoen er opprettet, vil du
            bli bedt om å laste opp en originalfil for denne videoen.
          </p>
        </div>
        <VideoCreateForm organizationId={parseInt(organizationId)} categories={categories.results} />
      </ModalIshPrototypeBody>
    </ModalIshPrototype>
  );
}
