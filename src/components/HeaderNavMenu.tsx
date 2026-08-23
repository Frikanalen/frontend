"use client";
import { Navbar, NavbarContent, NavbarMenu, NavbarMenuToggle } from "@heroui/react";
import { Avatar } from "@heroui/react";
import { NavLink } from "@/components/NavLink";
import Link from "next/link";
import { User } from "@/generated/frikanalenDjangoAPI.schemas";
import { useState } from "react";

// Declared once and rendered twice - across the bar on a wide screen, down the
// drawer on a narrow one - so the two can't drift apart.
const SECTIONS = [
  { href: "/", label: "Direkte" },
  { href: "/video", label: "Arkiv", activeRegexp: /\/video.*/ },
  { href: "/schedule", label: "Sendeplan", activeRegexp: /\/schedule.*/ },
  { href: "/about", label: "Om oss", activeRegexp: /\/about.*/ },
  { href: "/about/join", label: "Bli med" },
];

export const HeaderNavMenu = ({ className, user }: { className?: string; user: User | null }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    // Labelled because the archive's pagination adds a second navigation
    // landmark to the page, and two unnamed ones are indistinguishable when
    // jumping between landmarks.
    // Without the panel it used to sit in, the bar has no background of its own
    // to paint - it would otherwise cover the brand glow with an opaque band -
    // and its wrapper's default 24px inset would push the links a step right of
    // the logo, the card and the footer, which all line up on the same edge.
    <Navbar
      aria-label="Hovedmeny"
      className={`bg-transparent ${className ?? ""}`}
      classNames={{ wrapper: "px-0", menu: "h-[calc(100dvh-var(--navbar-height))]! bg-background" }}
      maxWidth={"full"}
      isBlurred={false}
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
    >
      {/* Five sections and the account button overrun a phone - the row measured
          397px of content in a 359px box, putting the avatar past the right
          edge - so below `sm` they move into a drawer behind a toggle. */}
      <NavbarContent className={"hidden sm:flex"}>
        {SECTIONS.map(({ href, label, activeRegexp }) => (
          <NavLink key={href} href={href} activeRegexp={activeRegexp}>
            {label}
          </NavLink>
        ))}
      </NavbarContent>

      <NavbarContent justify={"end"} className={"gap-2"}>
        {user ? (
          <Link href={"/profile"}>{user.firstName}</Link>
        ) : (
          <Link href="/login">
            <Avatar className={"text-default-foreground"} showFallback />
          </Link>
        )}
        <NavbarMenuToggle
          className={"sm:hidden"}
          aria-label={isMenuOpen ? "Lukk menyen" : "Åpne menyen"}
        />
      </NavbarContent>

      {/* The drawer needs both an opaque surface and a height, set on the slot
          above. The bar is deliberately transparent and `isBlurred` is off, so
          there is no backdrop blur standing in for a background; and HeroUI's
          motion layer leaves an inline `height: 0` on the panel, which only an
          `!important` utility outranks - without it the panel collapses to its
          padding and the links spill onto the page unbacked. */}
      <NavbarMenu>
        {SECTIONS.map(({ href, label, activeRegexp }) => (
          <NavLink key={href} href={href} activeRegexp={activeRegexp} onNavigate={closeMenu}>
            {label}
          </NavLink>
        ))}
      </NavbarMenu>
    </Navbar>
  );
};
