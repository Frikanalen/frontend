"use client";
import { Button } from "@heroui/react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { GoPasskeyFill } from "react-icons/go";
import { FormError } from "@/components/form/FormError";
import { browserSupportsWebAuthn, Cancelled, loginWithPasskey } from "@/lib/webauthn";
import { browserSupportsWebAuthnAutofill } from "@simplewebauthn/browser";

const noop = () => () => {};

/**
 * Log in with a passkey, without email or password: a button, and the
 * browser's own offer of passkeys in the email field's autofill where it
 * has that (the field carries autocomplete="username webauthn").
 */
export const PasskeyLogin = ({ onLoggedIn }: { onLoggedIn: () => void }) => {
  const supported = useSyncExternalStore(noop, browserSupportsWebAuthn, () => false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Autofill: a request that waits quietly until the person picks a passkey
  // from the email field's suggestions. Pressing the button replaces it.
  useEffect(() => {
    let live = true;
    void browserSupportsWebAuthnAutofill().then((autofill) => {
      if (!autofill || !live) return;
      loginWithPasskey(true).then(onLoggedIn, (cause: unknown) => {
        if (live && !(cause instanceof Cancelled)) {
          setError(cause instanceof Error ? cause.message : String(cause));
        }
      });
    });
    return () => {
      live = false;
    };
  }, [onLoggedIn]);

  if (!supported) return null;

  return (
    <div className="mt-6 flex w-full flex-col gap-2 border-t border-foreground/10 pt-6">
      <FormError error={error} />
      <Button
        variant="secondary"
        className="w-full"
        isPending={pending}
        onPress={async () => {
          setError(null);
          setPending(true);
          try {
            await loginWithPasskey();
            onLoggedIn();
          } catch (cause) {
            if (!(cause instanceof Cancelled)) {
              setError(cause instanceof Error ? cause.message : String(cause));
            }
          } finally {
            setPending(false);
          }
        }}
      >
        <GoPasskeyFill aria-hidden="true" />
        Logg inn med passkey
      </Button>
      <p className="text-foreground/60 text-xs">
        Med Touch ID, Face ID, Windows Hello, telefonen eller en sikkerhetsnøkkel.
      </p>
    </div>
  );
};
