// app/providers.tsx
"use client";

import { ReactNode } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/getQueryClient";
import { CsrfPrime } from "@/app/organization/[organizationId]/CsrfPrime";
import { I18nProvider } from "react-aria-components";

export const Providers = ({ children }: Readonly<{ children: ReactNode }>) => {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Its own storage key: Django admin, on the same origin, saves its
          theme toggle ("auto", "light", "dark") under "theme", and
          next-themes would apply "auto" as a class and drop dark mode. */}
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        storageKey="frikanalen-theme"
      >
        {/* React Aria otherwise follows the browser's language, so a visitor
            with an English browser hears "Insert before …" on a Norwegian page. */}
        <I18nProvider locale="nb-NO">
          <CsrfPrime />

          {children}
        </I18nProvider>
      </NextThemesProvider>
    </QueryClientProvider>
  );
};
