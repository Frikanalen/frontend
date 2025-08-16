import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";
import { HeaderNavMenu as HeaderNavMenu } from "../components/HeaderNavMenu";
import { Logo } from "@/components/Logo";
import { Providers } from "@/app/providers";
import { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { getCookiesFromRequest } from "@/app/profile/getCookiesFromRequest";
import { getUserOrNull } from "@/app/getUserOrNull";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
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
      <head>
        <title>Frikanalen</title>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-radial from-primary-200/40 dark:from-primary-600/60 to-primary-50 dark:to-primary-foreground text-foreground`}
      >
        <Providers>
          <div className="flex flex-col items-center min-h-screen">
            <header className="w-full max-w-5xl px-2">
              <Logo className="w-100 pt-12 text-default-foreground/80" />
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
