import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GoArrowLeft } from "react-icons/go";
import { getCookiesFromRequest } from "@/lib/getCookiesFromRequest";
import { getUserOrNull } from "@/app/getUserOrNull";
import { UserProfileForm } from "@/app/profile/edit/UserProfileForm";
import { PasswordSection } from "@/app/profile/edit/PasswordSection";
import { LoginMethodsSection } from "@/app/profile/edit/LoginMethodsSection";

export const metadata: Metadata = {
  title: "Endre profil - Frikanalen",
};

/**
 * Each thing you come here to do has its own card and its own button: your
 * details, your password, how you log in. They save separately, so a half-typed
 * password never rides along with a name change or the reverse.
 */
export default async function Page() {
  const headers = await getCookiesFromRequest();
  const user = await getUserOrNull(headers);
  if (!user) redirect("/login");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/profile"
          className="text-foreground/75 hover:text-foreground inline-flex items-center gap-1.5 text-sm"
        >
          <GoArrowLeft aria-hidden="true" />
          Min side
        </Link>
        <h1 className="mt-1 text-3xl font-bold">Endre profil</h1>
      </div>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <UserProfileForm user={user} />
        <div className="flex flex-col gap-6">
          <PasswordSection email={user.email} />
          <LoginMethodsSection />
        </div>
      </div>
    </div>
  );
}
