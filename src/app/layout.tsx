import type { Metadata } from "next";
import { Geist_Mono, Schibsted_Grotesk } from "next/font/google";
import "@/styles/globals.css";
import { HeaderNavMenu as HeaderNavMenu } from "../components/HeaderNavMenu";
import { Logo } from "@/components/Logo";
import { Providers } from "@/app/providers";
import { ReactNode } from "react";
import Link from "next/link";
import { BrandStripe } from "@/components/layout/BrandStripe";
import { Footer } from "@/components/layout/Footer";
import { getCookiesFromRequest } from "@/lib/getCookiesFromRequest";
import { getUserOrNull } from "@/app/getUserOrNull";
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
                <HeaderNavMenu user={user} className="min-w-0 grow" />
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
