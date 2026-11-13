import type { Metadata } from "next";
import { Geist_Mono, Schibsted_Grotesk } from "next/font/google";
import "@/styles/globals.css";
import { HeaderNavMenu, HeaderNavMenuPlaceholder } from "../components/HeaderNavMenu";
import { Logo } from "@/components/Logo";
import { Providers } from "@/app/providers";
import { ReactNode, Suspense } from "react";
import Link from "next/link";
import { BrandStripe } from "@/components/layout/BrandStripe";
import { Footer } from "@/components/layout/Footer";
import { getCurrentUser } from "@/lib/getCurrentUser";
import Head from "next/head";

// One family for everything: a Norwegian open-source grotesque with enough
// character in its heavy weights to carry headlines, and plain enough to set
// a schedule in.
const schibsted = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://frikanalen.tv"),
  title: "Frikanalen",
  description: "Frikanalen er sivilsamfunnets videoplatform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  // Not awaited: who is signed in is the one per-visitor thing on most
  // pages, so the header streams it in behind <Suspense> and everything else
  // can be served from the static shell.
  const user = getCurrentUser();

  return (
    <html lang="no" suppressHydrationWarning>
      <Head>
        <title>Frikanalen</title>
      </Head>
      <body
        className={`${schibsted.variable} ${geistMono.variable} font-sans antialiased text-foreground`}
      >
        <Providers>
          <div className="flex flex-col items-center min-h-screen">
            {/* The channel bar: the same dark "stage" the player sits on, so
                on the front page the two read as one surface. */}
            <div className="w-full bg-stage text-stage-foreground">
              <BrandStripe />
              <header className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-10 gap-y-1 px-4 py-3 sm:px-6">
                <Link href="/" aria-label="Frikanalen, til forsiden" className="shrink-0">
                  <Logo className="h-9 w-auto text-stage-foreground sm:h-10" />
                </Link>
                <Suspense fallback={<HeaderNavMenuPlaceholder className="min-w-0 grow" />}>
                  <HeaderNavMenu user={user} className="min-w-0 grow" />
                </Suspense>
              </header>
            </div>
            <div className="flex grow flex-col w-full items-center">{children}</div>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
