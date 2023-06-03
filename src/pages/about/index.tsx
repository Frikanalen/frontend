import { Meta } from "src/modules/core/components/Meta"
import Link from "next/link"
import { AboutLinkBar } from "../../modules/core/components/aboutLinkBar"

const Sitat = ({ className }: { className?: string }) => (
  <div className={className}>
    <div className={"lg:border-r-4 max-lg:border-b-4 border-orange-600 italic-semi my-2 text-right text-gray-800 p-4"}>
      <div className={"font-extrabold text-xl italic-semi"}>
        «&nbsp;Målet med Frikanalen er å styrke ytringsfrihet og deltakerdemokratiet ved å gi flere mulighet til å ytre
        seg i TV-mediet.&nbsp;»
      </div>
      <div className={"text-right pt-2 pr-2"}>
        <Link
          href={"/about/statutes"}
          passHref
          className={"text-orange-900 text-xl hover:text-orange-100 no-underline"}
        >
          Frikanalens formålsparagraf
        </Link>
      </div>
    </div>
  </div>
)

export const About = () => (
  <div className={"w-full"}>
    <Meta
      meta={{
        title: "Om",
        description: "Informasjon om Frikanalen og hvordan du kan bli medlem",
      }}
    />
    <AboutLinkBar />
    <div className={"space-y-4 lg:pr-12 lg:pb-24"}>
      <div className={"flex max-lg:flex-col gap-4"}>
        <Sitat className={"max-w-[450px]"} />
        <div className="p-2 space-y-2">
          <h2 className={"text-3xl text-gray-800 font-bold "}>Frikanalen er sivilsamfunnets videoplatform</h2>

          <div className={"max-w-prose space-y-2"}>
            <p>
              I samarbeid med våre medlemsorganisasjoner vil vi styrke norsk samfunnsliv og frivillighet med en ideellt
              drevet videoplattform av og for medlemmer.
            </p>
            <p>
              Vi tilbyr alle våre medlemmer adgang til en riksdekkende TV-kanal tilgjengelig for alle på nett og
              kabel-TV.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
)

export default About
