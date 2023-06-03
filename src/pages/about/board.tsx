import Link from "next/link"
import { AboutLinkBar } from "../../modules/core/components/aboutLinkBar"

export const Board = () => (
  <div>
    <AboutLinkBar />
    <div className={"flex gap-4"}>
      <div className={"lg:basis-1/4"}>
        <div className={"bg-gradient-to-b from-green-300 to-green-400 italic-semi text-green-900 p-5 "}>
          placeholder
        </div>
      </div>
      <div className={""}>
        <p>
          Leder Ola Tellesbø kan nås på <Link href="mailto:post@frikanalen.no">post@frikanalen.no</Link>
        </p>
        <p>
          Teknisk leder Tore Sinding Bekkedal kan nås på{" "}
          <Link href="mailto:toresbe@protonmail.com">toresbe@protonmail.com</Link>
        </p>
        <p>
          Egil Skarning Langemyr (Evangeliekirken Arendal), styremedlem
        </p>
        <p>
          Olav Hardang (Bladet Evangelisten), styremedlem
        </p>
        <p>
          Estehan Zouain (NUUG), styremedlem
        </p>
        <p>
          Rune Hagerup, styremedlem
        </p>
      </div>
    </div>
  </div>
)
export default Board
