import { getCookiesFromRequest } from "@/app/profile/getCookiesFromRequest";
import { getUserOrNull } from "@/app/getUserOrNull";
import { redirect } from "next/navigation";
import { UserProfileForm } from "@/app/profile/edit/UserProfileForm";

export default async function Page() {
  const headers = await getCookiesFromRequest();
  const user = await getUserOrNull(headers);
  if (!user) redirect("/login");
  return (
    <div className="space-y-4 lg:p-10 flex flex-col lg:flex-row">
      <div className={"prose lg:max-w-sm basis-1/2 shrink-0"}>
        <h2 className={"mb-1!"}>Din profil</h2>
      </div>
      <UserProfileForm
        user={user}
        className={"max-lg:max-w-xl w-full border-4 border-primary-100 ml-4 p-4 rounded-lg"}
      />
    </div>
  );
}
