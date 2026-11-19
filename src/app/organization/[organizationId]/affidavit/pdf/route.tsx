import { renderToBuffer } from "@react-pdf/renderer";
import { getUserOrNull } from "@/app/getUserOrNull";
import { profileIsAdminOrMember } from "@/app/organization/[organizationId]/admin/profileIsAdminOrMember";
import { AffidavitPdf } from "@/app/organization/[organizationId]/affidavit/AffidavitPdf";
import { ssrOrganizationRetrieve } from "@/generated/ssr/organization/organization";
import { getCookiesFromRequest } from "@/lib/getCookiesFromRequest";
import { OrganizationParams } from "@/lib/routeParams";

const blankIfEmpty = (value: string | null | undefined) => value?.trim() || null;

/** The organization's own declaration as a PDF, for its editor and members. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  const parsed = OrganizationParams.safeParse(await params);
  if (!parsed.success) return new Response("Not found", { status: 404 });
  const { organizationId } = parsed.data;

  const headers = await getCookiesFromRequest();
  const user = await getUserOrNull(headers);
  if (!user) return new Response("Logg inn først.", { status: 401 });
  if (!user.isStaff && !profileIsAdminOrMember(organizationId, user))
    return new Response("Ingen tilgang.", { status: 403 });

  const response = await ssrOrganizationRetrieve(organizationId, { headers, cache: "no-store" });
  if (response.status !== 200) return new Response("Not found", { status: 404 });
  const organization = response.data;

  const pdf = await renderToBuffer(
    <AffidavitPdf
      details={{
        organization: organization.name,
        orgnr: blankIfEmpty(organization.orgnr),
        address: blankIfEmpty(organization.postalAddress),
        email: blankIfEmpty(organization.editorEmail),
        editorName: blankIfEmpty(organization.editorName)?.toUpperCase() ?? null,
      }}
    />,
  );

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="redaktorerklaering-${organizationId}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
