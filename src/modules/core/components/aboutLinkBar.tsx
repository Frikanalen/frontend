import { ReactNode } from "react"
import { useRouter } from "next/router"
import Link from "next/link"

export const AboutLink = ({ to, children }: { to: string; children: ReactNode }) => {
  const router = useRouter()

  const isActive = router.pathname.toString() == to

  return (
    <div
      className={
        "transition-color border-b-4 leading-8 text-green-500 " +
        (isActive
          ? "border-b-green-500"
          : "border-b-transparent contrast-0 hover:text-gray-700 hover:border-b-gray-700 hover:contrast-50")
      }
    >
      <Link href={to} passHref className={"font-extrabold"}>
        {children}
      </Link>
    </div>
  )
}

export const AboutLinkBar = () => (
  <div className={"text-xl lg:text-2xl flex pb-4 gap-4"}>
    <AboutLink to={"/about"}>Organisasjon</AboutLink>
    <AboutLink to={"/about/membership"}>Medlemskap</AboutLink>
    <AboutLink to={"/about/technical"}>Teknisk</AboutLink>
    <AboutLink to={"/about/board"}>Styret</AboutLink>
    <AboutLink to={"/about/statutes"}>Vedtekter</AboutLink>
  </div>
)
