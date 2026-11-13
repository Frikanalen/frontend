"use client";
import { useRef, useState } from "react";
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
 * Looks the number up in Enhetsregisteret when asked to (fetch), and calls
 * onFound with what the register knows. Filling in replaces what is in the
 * form, so it waits for the user's say-so rather than firing as they type.
 * The status describes the number as it stands: editing it clears an
 * earlier answer.
 */
export const useBrregLookup = (
  value: string | undefined,
  onFound: (_entity: BrregEntity) => void,
) => {
  const orgnr = normalizeOrgnr(value ?? "");
  const complete = /^\d{9}$/.test(orgnr);
  const valid = complete && isValidOrgnr(orgnr);
  const [result, setResult] = useState<{ orgnr: string; lookup: BrregLookup }>();
  const inFlight = useRef<AbortController>(undefined);

  const fetch = () => {
    if (!valid) return;
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;
    setResult({ orgnr, lookup: { state: "loading" } });
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
  };

  let lookup: BrregLookup = { state: "idle" };
  if (complete && !valid) lookup = { state: "invalid" };
  else if (valid && result?.orgnr === orgnr) lookup = result.lookup;

  return { lookup, canFetch: valid && lookup.state !== "loading", fetch };
};
