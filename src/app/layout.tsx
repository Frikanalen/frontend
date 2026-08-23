import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";
import { HeaderNavMenu as HeaderNavMenu } from "../components/HeaderNavMenu";
import { Logo } from "@/components/Logo";
import { Providers } from "@/app/providers";
import { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { getCookiesFromRequest } from "@/lib/getCookiesFromRequest";
import { getUserOrNull } from "@/app/getUserOrNull";
import Head from "next/head";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://frikanalen.no"),
  title: "Frikanalen",
  description: "Frikanalen er sivilsamfunnets videoplatform",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const headers = await getCookiesFromRequest();
  const user = await getUserOrNull(headers);

  return (
    <html lang="no" suppressHydrationWarning>
      <Head>
        <title>Frikanalen</title>
      </Head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased text-foreground`}>
        {/*
          The brand glow, on a layer of its own rather than on <body>.

          On <body> it was sized by the document, so a radial gradient - which
          centres itself in its own box - slid up and down the page depending
          on how much content happened to be below it. A short page put its
          bright middle straight behind the text; a long one pushed it down
          onto the cards. Sizing it against the viewport instead gives the same
          glow on every page, whatever the page turns out to contain.

          `fixed`, not `absolute`. Both are one viewport tall, but an absolute
          layer is anchored to the top of the document and scrolls away with
          it, so on any page taller than the viewport it runs out: below its
          bottom edge you see bare canvas. That edge only stayed invisible
          while the outer stop was exactly the canvas colour, and it is not -
          the ramp ends on a tint, so the layer met the canvas as a step at
          precisely 100vh, which is where a long page starts. Fixed to the
          viewport there is no bottom edge to meet: the glow is behind the
          content at every scroll position, on a page of any length.

          The dark stop is primary-200, not the primary-600 it started as. In
          the dark theme the primary scale is inverted, so primary-600 was a
          pale mint that put the centre at #5e896d, which the equally pale
          foreground disappeared into: 2.6:1 behind a heading, against the
          4.5:1 normal text needs.

          In the dark theme it carries a stop position as well as an alpha:
          45% alpha rather than 60, and held to 40% of the radius rather than
          starting to fall off at the centre point. Those pull in opposite
          directions on purpose - the centre is darker, and the plateau it
          sits on is wider, so the glow reads as a broad wash rather than as a
          bright spot with a steep skirt. The light theme keeps a single 40%
          stop from the centre, where the wash lands far from the text colour
          anyway.

          `closest-side` puts the ellipse edge on all four sides, so the ramp
          is finished everywhere on the boundary rather than being cut off
          mid-slope the way a default (farthest-corner) gradient would be.

          Stretching the layer to the document's height would be the other way
          to avoid a bottom edge, but an absolutely positioned box counts
          towards scrollable overflow - at 600vh this page went from 1856px to
          5400px of scroll - and it would put the bright middle at the middle
          of the document, which is the behaviour moving off <body> fixed.

          -z-10 puts it behind the content but in front of the canvas, which
          is where the theme's background colour already lives - HeroUI sets it
          on <html>. <body> deliberately carries no background of its own: a
          block-level descendant's background paints *after* negative-z-index
          children, so one there would cover this layer rather than sit behind
          it. It takes no pointer events and no accessible name: it is scenery.
        */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10 bg-radial-[closest-side] from-primary-200/40 to-background dark:from-primary-100/30 dark:to-primary-100/15 dark:from-50%"
        />

        <Providers>
          <div className="flex flex-col items-center min-h-screen">
            <header className="w-full max-w-5xl px-2">
              <Logo className="w-full max-w-100 pt-6 lg:pt-12 text-default-foreground/80" />
              <HeaderNavMenu user={user} className="my-3" />
            </header>
            <div className="flex grow flex-col w-full items-center">{children}</div>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
