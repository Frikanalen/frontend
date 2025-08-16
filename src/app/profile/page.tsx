import { OrgList } from "@/app/profile/OrgList";
import { getCookiesFromRequest } from "@/app/profile/getCookiesFromRequest";
import { getUserOrNull } from "@/app/getUserOrNull";
import { forbidden } from "next/navigation";
import { LogoutButton } from "@/app/profile/LogoutButton";
import { CreateOrgButton } from "@/app/profile/CreateOrgButton";

/*
ideally three cases here:
- user has no organization, is prompted to add one
- user has one organization,
- user has multiple organizations,

  in the latter two cases, a subtle prompt to add another is in order
 */

export default async function Page() {
  const headers = await getCookiesFromRequest();
  const user = await getUserOrNull(headers);
  if (!user) return forbidden();
  return (
    <section className={"prose max-w-none"}>
      <h2>Brukerside</h2>
      <h3>Din brukerprofil</h3>
      <div>
        Navn: {user.firstName} {user.lastName}
      </div>
      <div>Epost: {user.email}</div>
      <div>Telefonnummer: {user.phoneNumber}</div>
      <div className="flex gap-2 py-2">
        <LogoutButton />
        <CreateOrgButton />
      </div>
      <h3>Dine organisasjoner</h3>
      <OrgList memberOf={user.memberOf} editorOf={user.editorOf} />
    </section>
  );
}
