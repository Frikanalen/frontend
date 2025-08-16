"use client";

import { useCsrfRetrieve } from "@/generated/csrf/csrf";

export const CsrfPrime = () => {
  useCsrfRetrieve({ request: { withCredentials: true, headers: { "Cache-control": "no-store" } } });
  return null;
};
