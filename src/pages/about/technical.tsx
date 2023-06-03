import Link from "next/link"
import ReactMarkdown from "react-markdown"
import { AboutLinkBar } from "../../modules/core/components/aboutLinkBar"

const GithubLogo = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
)

const info = `
## Teknisk informasjon

Kildekoden er i GitHub, pull requests er velkomne :) 

Frikanalen kjører på et on-premise Kubernetes-cluster. Docker-images blir bygget av GitHub Actions.

Vår [frontend](https://github.com/frikanalen/frontend) er skrevet i Next.JS. Vi bruker Apollo til å kommunisere vha GraphQL med vår backend.

Vår [backend](https://github.com/frikanalen/toches) er en Koa/Node-applikasjon i TypeScript. Den eksponerer både et [REST](https://beta.frikanalen.no/api/v2/swagger)- og et [GraphQL](https://beta.frikanalen.no/api/v2/graphql)-API.

Media blir lastet opp til og behandlet av vår [mediebehandler](https://github.com/frikanalen/media-processor).

I tillegg til en legacy-versjon som fremdeles kjører på [frikanalen.no](frikanalen.no),
utvikler vi en ny tredje generasjons softwarestack som du bruker her nå.

Legacy-versjonen kan ses i [vårt monorepo](https://github.com/frikanalen/frikanalen).

Ta gjerne kontakt med teknisk leder om du ønsker å bidra.`

export const TechInfoPage = () => {
  return (
    <div>
      <AboutLinkBar />
      <div className={"flex gap-2"}>
        <div className={"lg:basis-1/4"}>
          <div className={"bg-gradient-to-b from-green-200 to-green-300 italic-semi text-green-900 p-5 flex"}>
            <div>
              <GithubLogo className={"inline h-[1em] mr-1"} />
            </div>
            <div>
              <div className={"text-xl flex items-center"}>GitHub:</div>
              <ul className={"list-disc"}>
                <li>
                  <Link className="underline" href="https://github.com/frikanalen/frontend">
                    Frontend
                  </Link>
                </li>
                <li>
                  <Link className="underline" href="https://github.com/frikanalen/toches">
                    Backend
                  </Link>
                </li>
                <li>
                  <Link className="underline" href="https://github.com/frikanalen/media-processor">
                    Mediebehandler
                  </Link>
                </li>
                <li>
                  <Link className="underline" href="https://github.com/frikanalen/on-air-graphics">
                    Sendegrafikk
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <section className={"prose prose-lg text-black px-2"}>
          <ReactMarkdown>{info}</ReactMarkdown>
        </section>
      </div>
    </div>
  )
}

export default TechInfoPage
