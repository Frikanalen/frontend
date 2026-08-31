"use client";
import { Avatar, Navbar, NavbarContent, NavbarMenuToggle } from "@heroui/react";
import { NavLink } from "@/components/NavLink";
import Link from "next/link";
import cx from "classnames";
import { usePathname } from "next/navigation";
import { User } from "@/generated/frikanalenDjangoAPI.schemas";
import { useState } from "react";

// Declared once and rendered twice - across the bar on a wide screen, down the
// menu on a narrow one - so the two can't drift apart.
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
  const path = usePathname();

  // Decided here rather than inside each row, so the bar and the menu can
  // never disagree about which section you are in.
  //
  // Longest match wins, because the sections overlap: /about/join is inside
  // /about, so on the join page both "Bli med" and "Om oss" answer to the
  // path. Marking both was survivable while the marker was bold text, but it
  // reads as two current sections once they are filled rows - and only one
  // element on a page may claim aria-current="page".
  const activeHref = SECTIONS.filter(({ href, activeRegexp }) =>
    activeRegexp ? activeRegexp.test(path) : href === path,
  ).sort((a, b) => b.href.length - a.href.length)[0]?.href;

  const sections = SECTIONS.map((section) => ({
    ...section,
    isActive: section.href === activeHref,
  }));

  return (
    // Our own landmark rather than the one HeroUI's Navbar would render,
    // because the narrow-screen menu sits outside that component (see below)
    // and the links in it belong inside the navigation all the same. Labelled
    // because the archive's pagination adds a second navigation landmark to
    // the page, and two unnamed ones are indistinguishable when jumping
    // between landmarks.
    <nav aria-label="Hovedmeny">
      {/* Without the panel it used to sit in, the bar has no background of its
          own to paint - it would otherwise cover the brand glow with an opaque
          band - and its wrapper's default 24px inset would push the links a
          step right of the logo, the card and the footer, which all line up on
          the same edge. */}
      <Navbar
        as={"div"}
        className={cx("bg-transparent", className)}
        classNames={{ wrapper: "px-0" }}
        maxWidth={"full"}
        // A 40px avatar and a hamburger do not need the default 4rem of room,
        // and the row sits directly under an already tall logo.
        height={"3rem"}
        isBlurred={false}
        // Nothing is covered while the menu is open - it takes its space in
        // the page rather than over it - so there is nothing to scroll under
        // and no reason to freeze the page behind it.
        shouldBlockScroll={false}
        isMenuOpen={isMenuOpen}
        onMenuOpenChange={setIsMenuOpen}
      >
        {/* Five sections and the account button overrun a phone - the row measured
            397px of content in a 359px box, putting the avatar past the right
            edge - so below `sm` they move into the menu behind a toggle. */}
        <NavbarContent className={"hidden sm:flex"}>
          {sections.map(({ href, label, isActive }) => (
            <NavLink key={href} href={href} isActive={isActive}>
              {label}
            </NavLink>
          ))}
        </NavbarContent>

        <NavbarContent justify={"end"} className={"gap-2"}>
          {user ? (
            <Link href={"/profile"}>{user.firstName}</Link>
          ) : (
            <Link href="/login">
              <Avatar className={"text-default-foreground"} size={"sm"} showFallback />
            </Link>
          )}
          <NavbarMenuToggle
            className={"sm:hidden"}
            srOnlyText={isMenuOpen ? "Lukk menyen" : "Åpne menyen"}
          />
        </NavbarContent>
      </Navbar>

      {/* Deliberately not HeroUI's `NavbarMenu`.
          That one is a fixed, full-viewport drawer positioned at
          `top: var(--navbar-height)` - which assumes the bar it belongs to is
          itself at the top of the viewport. Here it is not: the logo above it
          is `w-full max-w-100`, so the bar starts anywhere from ~110px down on
          a phone to lower still on a wide window, and the drawer opened that
          much too high. It slid under the bar, and the bar's own end-content
          row - full width, `h-full`, and a z-layer above the drawer - then ate
          every tap that landed in that band. Which rows died depended on where
          the logo happened to end, so it read as "Sendeplan doesn't work" from
          one window width and "Om oss doesn't work" from another. The front
          page's click-to-play overlay outranked the drawer too, killing a
          third row there.
          In the flow of the header there is no offset to get wrong and no
          stack to lose: the menu is simply the next thing on the page, and it
          pushes the content down for as long as it is open. Five one-word
          links also never justified a 100dvh takeover - nine tenths of that
          drawer was empty. */}
      {isMenuOpen && (
        <ul
          className={
            "border-default-200 bg-content1/60 mb-3 flex flex-col gap-1 rounded-2xl border p-2 sm:hidden"
          }
        >
          {sections.map(({ href, label, isActive }) => (
            <li key={href}>
              <Link
                href={href}
                onClick={closeMenu}
                aria-current={isActive ? "page" : undefined}
                className={cx(
                  // h-11 rather than the 19px the bare text measured: this is
                  // the one place the links are meant to be hit with a thumb.
                  "flex h-11 items-center rounded-xl px-3 transition-colors",
                  "outline-focus focus-visible:outline-2 focus-visible:outline-offset-2",
                  // A primary tint for the section you are in, rather than
                  // the grey used for a pressed control: on a page built out
                  // of the brand green a grey band reads as disabled.
                  isActive
                    ? "bg-primary-100 text-primary-800 font-semibold"
                    : "text-foreground/80 hover:bg-default-100 hover:text-foreground",
                )}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
};
