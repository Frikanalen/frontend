import { userRetrieve } from "@/generated/user/user";
import { headers } from "next/headers";
import { AxiosHeaders } from "axios";
import { OrgList } from "@/app/profile/OrgList";

/*
ideally three cases here:
- user has no organization, is prompted to add one
- user has one organization,
- user has multiple organizations,

  in the latter two cases, a subtle prompt to add another is in order
 */

export default async function Page() {
  const incomingHeaders = await headers();
  const cookieHeader = incomingHeaders.get("Cookie");

  const requestHeader = new AxiosHeaders();
  requestHeader.set("Cookie", cookieHeader);

  const { data } = await userRetrieve({ headers: requestHeader });
  return (
    <main className="grow max-w-3xl w-full p-8">
      <section className="bg-background rounded-md shadow-lg p-8">
        <h2 className={"text-lg font-bold pb-4"}>Brukerside</h2>
        <OrgList memberOf={data.memberOf} editorOf={data.editorOf} />
      </section>
    </main>
  );
}
