import { getCookiesFromRequest } from "@/lib/getCookiesFromRequest";
import { getUserOrNull } from "@/app/getUserOrNull";
import { redirect } from "next/navigation";
import { UserProfileForm } from "@/app/profile/edit/UserProfileForm";

export default async function Page() {
  const headers = await getCookiesFromRequest();
  const user = await getUserOrNull(headers);
  if (!user) redirect("/login");
  return (
    <div className="flex flex-col gap-4 bg-background p-6 sm:p-8 lg:flex-row">
      <div className={"prose dark:prose-invert lg:max-w-sm basis-1/2 shrink-0"}>
        <h2 className={"mb-1!"}>Din profil</h2>
      </div>
      <UserProfileForm user={user} className={"w-full max-lg:max-w-xl"} />
    </div>
  );
}
