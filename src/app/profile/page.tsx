import { OrgList } from "@/app/profile/OrgList";
import { getCookiesFromRequest } from "@/app/profile/getCookiesFromRequest";
import { ModalIshPrototype } from "@/app/profile/ModalIshPrototype";
import { getUserOrNull } from "@/app/getUserOrNull";
import { forbidden } from "next/navigation";

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
    <ModalIshPrototype>
      <h2 className={"text-lg font-bold pb-4"}>Brukerside</h2>
      <OrgList memberOf={user.memberOf} editorOf={user.editorOf} />
    </ModalIshPrototype>
  );
}
