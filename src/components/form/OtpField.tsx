"use client";
import { forwardRef, type InputHTMLAttributes } from "react";
import { AuthField } from "@/components/form/AuthField";

/**
 * The second step of a login (or reset) for an account with two-factor on:
 * a code from the authenticator app, or one of the recovery codes.
 */
export const OtpField = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "value" | "defaultValue"> & {
    errorMessage?: string;
    /** The account also has a security key, so the code is one way of two. */
    withKey?: boolean;
  }
>(({ errorMessage, withKey, ...props }, ref) => (
  <div className="flex flex-col gap-1">
    <AuthField
      {...props}
      ref={ref}
      id="otp"
      label="Kode fra autentiseringsappen"
      autoComplete="one-time-code"
      inputMode="text"
      autoFocus={!withKey}
      required={!withKey}
      isInvalid={!!errorMessage}
      errorMessage={errorMessage}
    />
    <p className="text-foreground/60 text-xs">
      {withKey
        ? "Eller skriv inn en kode fra appen, eller en av gjenopprettingskodene."
        : "Kontoen har totrinnsbekreftelse. Mistet telefonen? Skriv inn en av gjenopprettingskodene."}
    </p>
  </div>
));
OtpField.displayName = "OtpField";
