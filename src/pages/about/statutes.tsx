import { Meta } from "src/modules/core/components/Meta"
import React from "react"
import { AboutLinkBar } from "../../modules/core/components/aboutLinkBar"

export default function About() {
  return (
    <div className={""}>
      <Meta
        meta={{
          title: "Våre vedtekter",
          description: "Her kan du lese vedtektene for Foreningen Frikanalen",
        }}
      />
      <AboutLinkBar />
      <article className={"flex flex-col lg:flex-row "}>
        <header className={"text-gray-900 p-4 lg:pr-12 lg:pb-24 bg-gradient-to-b from-green-200 to-green-300 h-fit"}>
          <h2 className={"text-5xl font-bold"}>Vedtekter</h2>
          <div className={"text-xl font-semibold"}>
            for <span className={"font-bold"}>Foreningen Frikanalen</span>
          </div>
          <div className={"font-serif text-sm pt-3"}>
            <p>Vedtatt på stiftelsesmøtet 14. juni 2007.</p>
            <p>
              Revidert av årsmøtet 4. februar 2008, <br />
              28.april 2011, 28. mai 2015 og 13. mars 2021.
            </p>
          </div>
        </header>

        <div
          className={
            "pr-2 pt-1 max-w-[800px] prose text-justify lg:prose-lg prose-slate prose-p:ml-4 " +
            "prose-h5:font-sans prose-h5:font-bold prose-li:ml-4 prose-li:font-serif prose-p:font-serif [&_section]:ml-4 "
          }
        >
          <section>
            <h4 className={"lg:!mt-0"}>§ 1. Navn</h4>

            <p>Foreningen Frikanalen, også omtalt som Åpen kanal, er en selvstendig forening stiftet 14.06.2007.</p>
          </section>
          <section>
            <h4>§ 2. Formål</h4>

            <p>
              Foreningen skal tilrettelegge for ikke-kommersiell, allmenn deltakelse i den åpne TV-kanalen i det
              digitale bakkenettet og på andre distribusjonsplattformer (heretter kalt Frikanalen).
            </p>
            <p>
              Frikanalen er en TV-kanal der frivillige organisasjoner, livssynsorganisasjoner og andre ikke-
              kommersielle virksomheter kan få tildelt sendetid på rimelige vilkår.
            </p>
            <p>
              Målet med Frikanalen er å styrke ytringsfriheten og det deltakende demokratiet gjennom å gi flere mulighet
              til å ytre seg gjennom TV-mediet.
            </p>
            <p>
              Foreningen skal koordinere arbeidet med kanalen, drive rådgivning og kompetansehevende tiltak, stimulere
              organisasjoner og andre til å ta TV-mediet i bruk, samt drive interessepolitisk arbeid knyttet til
              kanalen.
            </p>
            <p>
              Foreningen skal ikke drive redaksjonell forhåndskontroll av innhold i deltakernes programmer. Virksomheten
              bygger på forutsetningene i Stortingets vedtak i 2004 (innst.S.nr.128) om digitalt bakkenett for fjernsyn.
            </p>
          </section>
          <section>
            <h4>§ 3. Medlemskap</h4>
            <p>
              Medlemskap i Foreningen Frikanalen er åpent for alle som driver frivillig virke på ikke-
              fortjenestebasert/ikke-offentlig basis i Norge, i henhold til avgrensningene i lov om
              frivillighetsregister § 3 og § 4.
            </p>
            <section>
              <h5>§ 3-1. Plikter</h5>

              <p>
                Medlemmene skal betale kontingent til Foreningen Frikanalen. Kontingenten regnes etter sist tilgjengelig
                regnskap. Fysiske personer betaler minstesats eller et beløp per sending tilsvarende ca. en tredjedel av
                minstesatsen.
              </p>
              <p>
                Med unntak for fysiske personer skal medlemmet innen 15. februar hvert år sende medlemsopplysninger til
                Foreningen Frikanalen på avtalt skjema/medium. Alle medlemmene er pliktige til å rette seg etter
                gjeldende vedtekter.
              </p>
            </section>
            <section>
              <h5>§ 3-2. Rettigheter</h5>

              <p>
                Medlemmer har rett til å benytte Frikanalen til å distribuere programmer. Medlemmenes rett til å bruke
                Frikanalen for distribusjon av programmer gjelder utelukkende ikke-kommersiell bruk.
              </p>
              <p>
                Medlemmene gis ikke rett til å bevisst bruke senderetten til skjult eller åpenbar reklame, herunder
                sponsing, tekstreklame, logoer eller produktplassering, for tredjeparts varer eller tjenester.
              </p>
              <p>
                Sendetidsfordelingen skal gi mulighet for fast sendetid for medlemmer som ønsker det og sette av åpne
                flater for enkeltprogrammer. Intet enkeltmedlem skal kunne tildeles mer enn én times fast sendetid pr
                dag. Sendetidspunkt som anses som spesielt gunstige skal rotere mellom aktørene.
              </p>
            </section>
            <section>
              <h5>§ 3-3. Utmelding</h5>

              <p>
                Medlemmer som ønsker å melde seg ut må sende skriftlig melding om dette til Foreningen Frikanalen senest
                1. desember, for at utmeldingen skal være gyldig fra 1. januar neste år.
              </p>
            </section>
          </section>
          <section>
            <h4>§ 4. Årsmøtet</h4>
            <p>
              Årsmøtet er Foreningen Frikanalen høyeste myndighet. Det skal holdes ordinært Årsmøte innen utgangen av
              31. mars hvert år. Det skal kalles inn til ekstraordinært Årsmøte dersom minst 3 styremedlemmer eller 2/3
              av medlemmene krever det.
            </p>
            <section>
              <h5>§ 4-1. Innkalling og saker til Årsmøtet</h5>

              <p>
                Innkallingen sendes senest 4 uker før ordinært og 2 uker før ekstraordinært Årsmøte. Medlemmer må fremme
                årsmøtesaker seinest 3 uker før Årsmøtet. Styrets årsmelding, revidert regnskap og saker til behandling
                på Årsmøte skal sendes til medlemmene senest 2 uker før Årsmøtet. Alle saker som er mottatt innen denne
                fristen, skal legges fram for Årsmøtet. Dette gjelder også forslag til vedtektsendringer.
              </p>
            </section>
            <section>
              <h5>§ 4-2. Dagsorden for Årsmøtet</h5>

              <ol>
                <li>
                  Konstituering
                  <ul>
                    <li>Åpning</li>
                    <li>Navneopprop/godkjenning av representantenes fullmakter</li>
                    <li>Godkjenne dagsorden</li>
                    <li>Valg av møteleder, møtesekretær og to protokoll-underskrivere </li>
                  </ul>
                </li>
                <li>Behandle styrets innstilling vedrørende medlemskap</li>
                <li>Godkjenne årsmelding</li>
                <li>Godkjenne revidert regnskap</li>
                <li>Behandle innkomne saker</li>
                <li>Behandle styrets forslag til handlingsprogram</li>
                <li>Behandle budsjett, herunder kontingent</li>
                <li>Valg </li>
                <ol style={{ listStyleType: "lower-alpha" }}>
                  <li>Leder – velges særskilt, for ett år</li>
                  <li>Nestleder – velges særskilt, for 2 år</li>
                  <li>3 styremedlemmer – velges for 2 år</li>
                  <li>Eventuell revisor.</li>
                  <li>
                    Valgkomite - bestående av 3 medlemmer, hvorav ett medlem kan være styremedlem i det sittende styret
                  </li>
                  <li>Eventuell kontrollkomite bestående av 2 medlemmer.</li>
                </ol>
              </ol>
            </section>
          </section>
          <section>
            <h4>§ 5. Styret</h4>

            <p>
              Styret består av leder, nestleder og fire styremedlemmer valgt av årsmøtet. Alle over 15 år kan velges til
              styreverv. Styret bør ha minst 1 medlem under 26 år og kjønnsbalanse.
            </p>
            <section>
              <h5>§ 5-1. Styrets oppgaver</h5>

              <p>Styret skal:</p>

              <ul>
                <li>lede Foreningen Frikanalen i perioden mellom Årsmøtene</li>
                <li>iverksette Årsmøtets vedtak</li>
                <li>kontrollere for nye medlemmer om det ikke-kommersielle/ikke-offentlige vilkåret er oppfylt</li>
                <li>har arbeidsgiveransvar for ansatte</li>
                <li>innkalle til årsmøte</li>
                <li>utarbeide årsmelding og regnskap</li>
                <li>fremme forslag til handlingsplan og budsjett</li>
                <li>
                  disponere organisasjonens inntekter i tråd med handlingsplan, budsjett og til beste for Foreningen
                  Frikanalen som landsomfattende organisasjon.
                </li>
                <li>ved styreleder innkalle til styremøter</li>
              </ul>
              <p>Styret er beslutningsdyktig når leder eller nestleder og to styremedlemmer er tilstede. </p>
            </section>
            <section>
              <h5>§ 5-2. Signatur</h5>

              <p>Styreleder og ett styremedlem sammen forplikter Foreningen Frikanalen med sine underskrifter. </p>
            </section>
          </section>
          <section>
            <h4>§ 6. Vedtektsendringer</h4>

            <p>Vedtektsendringer kan kun vedtas av Årsmøtet med 2/3 flertall. </p>
          </section>
          <section>
            <h4>§ 7. Oppløsning</h4>

            <p>
              Forslag om oppløsning av Foreningen Frikanalen behandles på Årsmøte. Begrunnet forslag må være sendt
              styret i Foreningen Frikanalen og alle tilsluttede medlemmer minst to måneder før Årsmøtet. Til oppløsning
              kreves 3⁄4 stemmeflertall. Årsmøtet bestemmer hvordan eventuelle disponible midler og eiendeler skal
              fordeles.
            </p>
          </section>
        </div>
      </article>
    </div>
  )
}
