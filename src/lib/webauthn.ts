import {
  browserSupportsWebAuthn,
  startAuthentication,
  startRegistration,
  WebAuthnError,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/browser";
import {
  user2faWebauthnBeginCreate,
  user2faWebauthnCompleteCreate,
  user2faWebauthnRegisterBeginCreate,
  user2faWebauthnRegisterCompleteCreate,
  userLoginPasskeyBeginCreate,
  userLoginPasskeyCompleteCreate,
} from "@/generated/user/user";
import type { MethodAdded, User } from "@/generated/frikanalenDjangoAPI.schemas";
import { apiErrorCode } from "@/lib/apiErrorCode";
import { formatApiError } from "@/lib/formatApiError";

/*
 * Passkeys and security keys. Each ceremony is the API's options handed to
 * the browser (via @simplewebauthn/browser, which turns WebAuthn's binary
 * fields into JSON and back), then the browser's answer handed to the API,
 * which checks it.
 */

export { browserSupportsWebAuthn };

/** Thrown when the person closed the browser's prompt or let it time out. */
export class Cancelled extends Error {}

const describe = (error: unknown): Error => {
  if (
    error instanceof WebAuthnError ||
    (error instanceof Error && error.name === "NotAllowedError")
  ) {
    const code = error instanceof WebAuthnError ? error.code : "";
    if (code === "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED") {
      return new Error("Denne nøkkelen er allerede lagt til.");
    }
    return new Cancelled("Avbrutt, eller nøkkelen svarte ikke i tide. Prøv igjen.");
  }
  if (error instanceof Error && error.name === "AbortError") return new Cancelled(error.message);
  return new Error(formatApiError(error));
};

/** Log in with a passkey: no email, no password. Returns the profile. */
export const loginWithPasskey = async (useBrowserAutofill = false): Promise<User> => {
  try {
    const { data: options } = await userLoginPasskeyBeginCreate().catch((error: unknown) => {
      // Autofill is offered quietly in the background; if it cannot start,
      // the button is still there.
      if (useBrowserAutofill) throw new Cancelled("Autofill unavailable");
      throw error;
    });
    const credential = await startAuthentication({
      optionsJSON: options as unknown as PublicKeyCredentialRequestOptionsJSON,
      useBrowserAutofill,
    });
    const { data: user } = await userLoginPasskeyCompleteCreate({ credential });
    return user;
  } catch (error) {
    throw error instanceof Cancelled ? error : describe(error);
  }
};

/**
 * Whether the account behind a password that was just found right (or the
 * logged-in session) has a security key to use as the second step.
 */
export const hasSecurityKey = async (): Promise<boolean> => {
  try {
    await user2faWebauthnBeginCreate();
    return true;
  } catch (error) {
    if (apiErrorCode(error, "detail") === "no_security_key") return false;
    if (apiErrorCode(error, "detail") === "no_pending_login") return false;
    throw describe(error);
  }
};

/**
 * The second step with a security key or passkey. After a password, send
 * the login (or reset) again afterwards: it then passes without a code. In a
 * logged-in session it lets the session change its sign-in methods.
 */
export const secondStepWithKey = async (): Promise<void> => {
  try {
    const { data: options } = await user2faWebauthnBeginCreate();
    const credential = await startAuthentication({
      optionsJSON: options as unknown as PublicKeyCredentialRequestOptionsJSON,
    });
    await user2faWebauthnCompleteCreate({ credential });
  } catch (error) {
    throw describe(error);
  }
};

/** Add a passkey or security key to the logged-in account. */
export const addKey = async (name: string): Promise<MethodAdded> => {
  try {
    const { data: options } = await user2faWebauthnRegisterBeginCreate();
    const credential = await startRegistration({
      optionsJSON: options as unknown as PublicKeyCredentialCreationOptionsJSON,
    });
    const { data } = await user2faWebauthnRegisterCompleteCreate({ credential, name });
    return data;
  } catch (error) {
    throw describe(error);
  }
};
