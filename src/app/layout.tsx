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
          onto the cards. `absolute inset-0` with no positioned ancestor sizes
          against the initial containing block instead, so the glow is one
          viewport tall wherever it lands, anchored at the top of the document
          and scrolling away with it - the same glow on every page, whatever
          the page turns out to contain.

          The dark stop is primary-200, not the primary-600 it started as, at
          the same 60% alpha - the alpha shapes the falloff, so leaving it
          alone keeps the reach and only darkens the centre. In the dark theme
          the primary scale is inverted, so primary-600 was a pale mint that
          at 60% put the centre at #5e896d, which the equally pale foreground
          disappeared into: 2.6:1 behind a heading, against the 4.5:1 normal
          text needs. primary-200 takes the centre to #285436.

          `closest-side` and `to-background` are what keep the bottom edge from
          showing as a line. The layer is one viewport tall, so below it you
          see the canvas; a default (farthest-corner) gradient is still
          mid-ramp at that edge, and it ended on primary-50/black rather than
          the canvas colour, so the two met at a visible step - 11 units per
          channel, worst in light mode. closest-side puts the ellipse edge on
          all four sides, so the ramp is finished everywhere on the boundary,
          and ending it on the background colour makes the boundary invisible.

          Making the layer very tall instead would push the edge out of reach,
          but an absolutely positioned box counts towards scrollable overflow:
          at 600vh this page went from 1856px to 5400px of scroll.

          -z-10 puts it behind the content but in front of the canvas, which
          is where the theme's background colour already lives - HeroUI sets it
          on <html>. <body> deliberately carries no background of its own: a
          block-level descendant's background paints *after* negative-z-index
          children, so one there would cover this layer rather than sit behind
          it. It takes no pointer events and no accessible name: it is scenery.
        */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-radial-[closest-side] from-primary-200/40 to-background dark:from-primary-200/60"
        />

        <Providers>
          <div className="flex flex-col items-center min-h-screen">
            <header className="w-full max-w-5xl px-2">
              <Logo className="w-full max-w-100 pt-6 sm:pt-12 text-default-foreground/80" />
              <HeaderNavMenu user={user} className="my-6 rounded-xl bg-background/80 shadow-lg" />
            </header>
            <div className="flex grow flex-col w-full items-center">{children}</div>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
