import { AffidavitClauses } from "@/app/about/join/affidavit/AffidavitClauses";

export default async function Page() {
  return (
    <section className={"prose max-w-3xl bg-background p-6 sm:p-10 dark:prose-invert"}>
      <h1>Redaktøransvar Frikanalen</h1>
      <div>
        <h3>Som redaktør på vegne av min organisasjon erklærer jeg:</h3>
        <AffidavitClauses />
      </div>
    </section>
  );
}
