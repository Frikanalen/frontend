"use client";
import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { organizationBrregRetrieve } from "@/generated/organization/organization";
import { BrregEntity } from "@/generated/frikanalenDjangoAPI.schemas";
import { isValidOrgnr, normalizeOrgnr } from "@/lib/orgnr";

export type BrregLookup =
  | { state: "idle" }
  | { state: "invalid" }
  | { state: "loading" }
  | { state: "found"; entity: BrregEntity }
  | { state: "not-found" | "deleted" | "unavailable" };

/**
 * Looks the number up in Enhetsregisteret once it is complete and valid,
 * and calls onFound with what the register knows. Typing on past a valid
 * number, or correcting it, starts over.
 */
export const useBrregLookup = (
  value: string | undefined,
  onFound: (_entity: BrregEntity) => void,
): BrregLookup => {
  const orgnr = normalizeOrgnr(value ?? "");
  const complete = /^\d{9}$/.test(orgnr);
  const valid = complete && isValidOrgnr(orgnr);
  const [result, setResult] = useState<{ orgnr: string; lookup: BrregLookup }>();

  useEffect(() => {
    if (!valid) return;
    const controller = new AbortController();
    organizationBrregRetrieve(orgnr, undefined, controller.signal).then(
      ({ data }) => {
        setResult({ orgnr, lookup: { state: "found", entity: data } });
        onFound(data);
      },
      (error) => {
        if (controller.signal.aborted) return;
        const status = isAxiosError(error) ? error.response?.status : undefined;
        const state = status === 404 ? "not-found" : status === 410 ? "deleted" : "unavailable";
        setResult({ orgnr, lookup: { state } });
      },
    );
    return () => controller.abort();
    // onFound is a fresh closure every render; only a new number means a new lookup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgnr, valid]);

  if (!complete) return { state: "idle" };
  if (!valid) return { state: "invalid" };
  if (result?.orgnr !== orgnr) return { state: "loading" };
  return result.lookup;
};
