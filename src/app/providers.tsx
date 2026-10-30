// app/providers.tsx
"use client";

import { ReactNode } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/getQueryClient";
import { CsrfPrime } from "@/app/organization/[organizationId]/CsrfPrime";

export const Providers = ({ children }: Readonly<{ children: ReactNode }>) => {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
        <CsrfPrime />

        {children}
      </NextThemesProvider>
    </QueryClientProvider>
  );
};
