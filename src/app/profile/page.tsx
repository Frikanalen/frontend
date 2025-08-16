import { OrgList } from "@/app/profile/OrgList";
import { getCookiesFromRequest } from "@/app/profile/getCookiesFromRequest";
import { getUserOrNull } from "@/app/getUserOrNull";
import { redirect } from "next/navigation";
import { ProfileButtons } from "@/app/profile/ProfileButtons";

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
  if (!user) return redirect("/");
  return (
    <section className={"prose max-w-none"}>
      <h2>Brukerside</h2>
      <h3>Din brukerprofil</h3>
      <div>
        Navn: {user.firstName} {user.lastName}
      </div>
      <div>Epost: {user.email}</div>
      <div>Telefonnummer: {user.phoneNumber}</div>
      <ProfileButtons />
      <h3>Dine organisasjoner</h3>
      <OrgList memberOf={user.memberOf} editorOf={user.editorOf} />
    </section>
  );
}
