"use client";

import { Input } from "@heroui/react";
import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

type AuthFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "id" | "value" | "defaultValue"
> & {
  id: string;
  label: ReactNode;
  isInvalid?: boolean;
  errorMessage?: ReactNode;
};

// TextField controls its input's value and clears pre-hydration autofill.
// Keep auth fields uncontrolled so password-manager fills survive mounting.
export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(
  ({ id, label, isInvalid, errorMessage, className, ...inputProps }, ref) => {
    const errorId = `${id}-error`;
    const describedBy = [inputProps["aria-describedby"], errorMessage ? errorId : undefined]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={className}>
        <label className="mb-1 block text-sm font-medium" htmlFor={id}>
          {label}
        </label>
        <Input
          {...inputProps}
          id={id}
          ref={ref}
          defaultValue=""
          aria-invalid={isInvalid || undefined}
          aria-describedby={describedBy || undefined}
        />
        {errorMessage && (
          <p className="mt-1 text-sm text-danger" id={errorId}>
            {errorMessage}
          </p>
        )}
      </div>
    );
  },
);
AuthField.displayName = "AuthField";
