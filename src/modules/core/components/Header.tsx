import React from "react"
import { Logo } from "./Logo"
import { NavLinks } from "./NavLinks"
import Link from "next/link"
import { MobileNavLinks } from "./MobileNavLinks"

// margins to "crop" logo to text: lg:ml-[-113px] lg:mb-[-55px]
export const Header = ({ className }: { className?: string }) => (
  <header className={className}>
    <div className={"flex items-center justify-between w-full pl-1 pb-3 md:py-2 lg:py-4"}>
      <Link aria-label="Forsiden" href={"/"} passHref>
        <Logo className={"w-40 md:w-72 xl:w-[500px] cursor-pointer"} />
      </Link>
      <MobileNavLinks className={"lg:hidden"} />
    </div>
    <NavLinks className={"max-lg:hidden flex gap-4 text-xl lg:text-3xl py-4"} />
  </header>
)
