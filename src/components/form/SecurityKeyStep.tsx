"use client";
import { Button } from "@heroui/react";
import { useState } from "react";
import { GoKey } from "react-icons/go";
import { FormError } from "@/components/form/FormError";
import { secondStepWithKey } from "@/lib/webauthn";

/**
 * The second step with a security key or passkey, for an account that has
 * one. When the key has answered, `onPassed` sends the form again: the API
 * then lets it through without a code.
 */
export const SecurityKeyStep = ({ onPassed }: { onPassed: () => void | Promise<void> }) => {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm">Kontoen har totrinnsbekreftelse.</p>
      <FormError error={error} />
      <Button
        variant="secondary"
        isPending={pending}
        onPress={async () => {
          setError(null);
          setPending(true);
          try {
            await secondStepWithKey();
            await onPassed();
          } catch (cause) {
            setError(cause instanceof Error ? cause.message : String(cause));
          } finally {
            setPending(false);
          }
        }}
      >
        <GoKey aria-hidden="true" />
        Bruk sikkerhetsnøkkel eller passkey
      </Button>
    </div>
  );
};
