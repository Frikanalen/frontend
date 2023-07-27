import Link from "next/link"
import { useRouter } from "next/router"
import React, { ReactNode, useContext } from "react"
import UserContext from "../../../refactor/UserContext"
import cx from "classnames"

// FIXME: Resolve duplication here between AboutLink and this
export const NavLink = ({ children, href, className }: { children: ReactNode; href: string; className?: string }) => {
  const router = useRouter()
  const active = (href?: string) => router.pathname.split("/")[1] == href?.slice(1)

  return (
    <Link
      href={href}
      className={cx(
        "font-bold transition border-b-4 leading-8 border-b-transparent",
        {
          "text-[#E88840]": active(href),
          "text-gray-600 hover:text-gray-800": !active(href),
          "hover:border-b-[#E88840]/50 border-b-[#E88840]": active(href) && href !== "/",
        },
        className,
      )}
    >
      {children}
    </Link>
  )
}

export const UserLinkOrLoginButton = ({ className = "" }: { className?: string }) => {
  const { session } = useContext(UserContext)

  switch (session) {
    case undefined:
      return null
    case null:
      return (
        <NavLink className={className} href={"/login"}>
          Logg inn
        </NavLink>
      )
    default:
      return (
        <NavLink className={className} href={"/user"}>
          Brukermeny
        </NavLink>
      )
  }
}

export const MAIN_MENU: Record<string, string> = {
  "/": "Direkte",
  "/video": "Arkiv",
  "/schedule": "Sendeplan",
  "/about": "Om oss",
}

export function NavLinks({ className }: { className?: string }) {
  return (
    <nav className={className}>
      {Object.entries(MAIN_MENU).map(([href, title]) => (
        <NavLink key={href} href={href}>
          {title}
        </NavLink>
      ))}
      <UserLinkOrLoginButton />
    </nav>
  )
}
