import { OrgCreateForm } from "@/app/organization/register/OrgCreateForm";
import { getCookiesFromRequest } from "@/lib/getCookiesFromRequest";
import { getUserOrNull } from "@/app/getUserOrNull";

export default async function Page() {
  const headers = await getCookiesFromRequest();
  const user = await getUserOrNull(headers);
  return (
    <div className="mx-4 mt-10 max-w-5xl bg-background p-6 text-foreground sm:p-8">
      <div className={"flex flex-col lg:flex-row gap-8"}>
        <div className={"prose dark:prose-invert lg:basis-1/3 shrink-0"}>
          <h2>Ny organisasjon</h2>
          <p>
            <span className={"font-bold"}>NB:</span> Ved å registrere deg som redaktør for en
            organisasjon, vil også din epost ({user?.email}) og ditt telefon&shy;nummer (
            {user?.phoneNumber}) bli offentlig synlig, i tråd med Kringkastings&shy;lovens krav om
            kontakt&shy;informasjon for redaktører.
          </p>
        </div>
        <div className={"max-lg:max-w-xl w-full"}>
          <OrgCreateForm className={""} />
        </div>
      </div>
    </div>
  );
}
