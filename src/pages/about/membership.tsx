import { AboutLinkBar } from "../../modules/core/components/aboutLinkBar"

export const MembershipPage = () => {
  return (
    <div>
      <AboutLinkBar />

      <div className={"flex gap-4"}>
        <div className={"lg:basis-1/4"}>
          <div className={"bg-gradient-to-b from-green-200 to-green-300 italic-semi text-black p-8"}>
            Alle individer og ikke-kommersielle organisasjoner kan tegne medlemskap og få sitt innhold på TV.
          </div>
        </div>
        <section className={"prose prose-lg"}>
          <p>Slik går du frem:</p>
          <ul>
            <li>
              Opprett en bruker på denne nettsiden, ved å trykke på «Logg inn» oppe til høyre, og så «Registrer ny
              konto?»
            </li>
            <li>Fra din brukerprofil, opprett en ny organisasjon</li>
          </ul>
        </section>
      </div>
    </div>
  )
}

export default MembershipPage
