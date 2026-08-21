import { describe, expect, it } from "vitest";
import { AxiosError, AxiosHeaders, type AxiosResponse } from "axios";
import { formatApiError } from "@/lib/formatApiError";

const FALLBACK = "Noe gikk galt. Prøv igjen.";

const axiosErrorWith = (data: unknown, status = 400): AxiosError => {
  const config = { headers: new AxiosHeaders() };
  const response = { data, status, statusText: "", headers: {}, config } as AxiosResponse;
  return new AxiosError(
    "Request failed with status code 400",
    "ERR_BAD_REQUEST",
    config,
    {},
    response,
  );
};

describe("formatApiError", () => {
  it("prefers DRF's top-level detail", () => {
    const error = axiosErrorWith({ detail: "Feil brukernavn eller passord." });
    expect(formatApiError(error)).toBe("Feil brukernavn eller passord.");
  });

  it("flattens serializer field errors instead of stringifying the object", () => {
    const error = axiosErrorWith({ email: ["Denne e-posten er allerede i bruk."] });
    const message = formatApiError(error);

    expect(message).toBe("Denne e-posten er allerede i bruk.");
    expect(message).not.toContain("[object Object]");
  });

  it("joins messages across several invalid fields", () => {
    const error = axiosErrorWith({
      email: ["Ugyldig e-post."],
      password: ["Passordet er for kort.", "Passordet er for vanlig."],
    });

    expect(formatApiError(error)).toBe(
      "Ugyldig e-post. Passordet er for kort. Passordet er for vanlig.",
    );
  });

  it("handles a bare list of non-field errors", () => {
    const error = axiosErrorWith(["Kontoen er deaktivert."]);
    expect(formatApiError(error)).toBe("Kontoen er deaktivert.");
  });

  it("passes through a plain string body", () => {
    const error = axiosErrorWith("Tjenesten er utilgjengelig.");
    expect(formatApiError(error)).toBe("Tjenesten er utilgjengelig.");
  });

  it("extracts details from standardized DRF errors", () => {
    const error = axiosErrorWith({
      type: "validation_error",
      errors: [
        { code: "invalid", detail: "Tiden kolliderer med et annet program.", attr: "duration" },
        { code: "invalid", detail: "Velg et annet tidspunkt.", attr: "starttime" },
      ],
    });

    expect(formatApiError(error)).toBe(
      "Tiden kolliderer med et annet program. Velg et annet tidspunkt.",
    );
  });

  it("falls back to the axios message when the body carries no usable text", () => {
    const error = axiosErrorWith({ unexpected: { nested: true } });
    expect(formatApiError(error)).toBe("Request failed with status code 400");
  });

  it("reports the transport failure when there is no response at all", () => {
    const config = { headers: new AxiosHeaders() };
    const error = new AxiosError("Network Error", "ERR_NETWORK", config);
    expect(formatApiError(error)).toBe("Network Error");
  });

  it("uses the message of a non-axios Error", () => {
    expect(formatApiError(new Error("Failed to update video 3 with status 500"))).toBe(
      "Failed to update video 3 with status 500",
    );
  });

  it("falls back for values that carry no message", () => {
    expect(formatApiError(undefined)).toBe(FALLBACK);
    expect(formatApiError(null)).toBe(FALLBACK);
    expect(formatApiError({ weird: true })).toBe(FALLBACK);
    expect(formatApiError("   ")).toBe(FALLBACK);
    expect(formatApiError(new Error(""))).toBe(FALLBACK);
  });

  it("never returns an empty string", () => {
    const inputs: unknown[] = [
      undefined,
      null,
      0,
      "",
      [],
      {},
      axiosErrorWith({}),
      axiosErrorWith([]),
      axiosErrorWith(""),
    ];

    for (const input of inputs) {
      expect(formatApiError(input).length).toBeGreaterThan(0);
    }
  });
});
