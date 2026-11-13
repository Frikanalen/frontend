"use client";
import { Button, Input } from "@heroui/react";
import { useState, useSyncExternalStore } from "react";
import { GoCheck, GoDeviceMobile, GoKey, GoPasskeyFill, GoShieldCheck } from "react-icons/go";
import { AuthField } from "@/components/form/AuthField";
import { FormError } from "@/components/form/FormError";
import type { Method, TwoFactorSetup } from "@/generated/frikanalenDjangoAPI.schemas";
import {
  useUser2faMethodsDestroy,
  useUser2faMethodsPartialUpdate,
  useUser2faRecoveryCodesCreate,
  useUser2faRetrieve,
  useUser2faTotpConfirmCreate,
  useUser2faTotpSetupCreate,
  useUser2faVerifyCreate,
} from "@/generated/user/user";
import { formatApiError } from "@/lib/formatApiError";
import { addKey, browserSupportsWebAuthn, Cancelled, secondStepWithKey } from "@/lib/webauthn";
import { ProfileCard } from "@/app/profile/edit/ProfileCard";

/** The secret in groups of four, the way apps ask for it to be typed. */
const grouped = (secret: string) => secret.match(/.{1,4}/g)?.join(" ") ?? secret;

const message = (cause: unknown) => (cause instanceof Error ? cause.message : String(cause));

const date = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("nb-NO", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Europe/Oslo",
      })
    : null;

const noop = () => () => {};
const useWebAuthn = () => useSyncExternalStore(noop, browserSupportsWebAuthn, () => false);

/** Shown once, right after they are made: the API never returns them again. */
const RecoveryCodes = ({
  codes,
  first,
  onDone,
}: {
  codes: readonly string[];
  first: boolean;
  onDone: () => void;
}) => {
  const [copied, setCopied] = useState(false);
  const text = codes.join("\n");
  const download = `data:text/plain;charset=utf-8,${encodeURIComponent(
    `Gjenopprettingskoder for Frikanalen\nHver kode virker én gang.\n\n${text}\n`,
  )}`;

  return (
    <div className="flex flex-col gap-4">
      {first && (
        <div role="status" className="text-success-700 inline-flex items-center gap-1.5 text-sm">
          <GoCheck aria-hidden="true" />
          Totrinnsbekreftelse er slått på.
        </div>
      )}
      <div>
        <h3 className="font-semibold">
          {first ? "Gjenopprettingskoder" : "Nye gjenopprettingskoder"}
        </h3>
        <p className="text-foreground/75 mt-1 text-sm">
          Mister du telefonen eller nøkkelen, kan du logge inn med en av disse i stedet. Hver kode
          virker én gang. Ta vare på dem nå, for de vises ikke igjen.
          {!first && " De gamle kodene virker ikke lenger."}
        </p>
      </div>
      <ul className="bg-default-100 grid grid-cols-2 gap-x-6 gap-y-1 rounded-lg p-4 font-mono text-sm">
        {codes.map((code) => (
          <li key={code}>{code}</li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="tertiary"
          onPress={() => {
            void navigator.clipboard?.writeText(text).then(() => setCopied(true));
          }}
        >
          {copied ? "Kopiert" : "Kopier"}
        </Button>
        <a
          href={download}
          download="frikanalen-gjenopprettingskoder.txt"
          className="bg-default-100 hover:bg-default-200 inline-flex h-10 items-center rounded-lg px-4 text-sm"
        >
          Last ned
        </a>
        <Button className="ml-auto" onPress={onDone}>
          Jeg har tatt vare på dem
        </Button>
      </div>
    </div>
  );
};

/**
 * A session that logged in before two-factor was on (or on another device)
 * has to show the second step before it may change anything.
 */
const VerifyFirst = ({ withKey, onVerified }: { withKey: boolean; onVerified: () => void }) => {
  const verify = useUser2faVerifyCreate();
  const [code, setCode] = useState("");
  const [keyPending, setKeyPending] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);

  return (
    <div className="bg-default-100 flex flex-col gap-3 rounded-lg p-4">
      <p className="text-sm">
        Bekreft at det er deg før du endrer innloggingsmetodene: bruk en nøkkel, eller skriv inn en
        kode.
      </p>
      {withKey && (
        <>
          <FormError error={keyError} />
          <Button
            className="w-fit"
            variant="secondary"
            isPending={keyPending}
            onPress={async () => {
              setKeyError(null);
              setKeyPending(true);
              try {
                await secondStepWithKey();
                onVerified();
              } catch (cause) {
                if (!(cause instanceof Cancelled)) setKeyError(message(cause));
              } finally {
                setKeyPending(false);
              }
            }}
          >
            <GoKey aria-hidden="true" />
            Bruk sikkerhetsnøkkel eller passkey
          </Button>
        </>
      )}
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          verify.mutate({ data: { code } }, { onSuccess: onVerified });
        }}
      >
        <AuthField
          id="verify-code"
          label="Kode fra appen eller en gjenopprettingskode"
          className="max-w-64 grow"
          autoComplete="one-time-code"
          required
          onChange={(event) => setCode(event.currentTarget.value)}
          isInvalid={!!verify.error}
          errorMessage={verify.error ? formatApiError(verify.error) : undefined}
        />
        <Button type="submit" variant="tertiary" isPending={verify.isPending}>
          Bekreft
        </Button>
      </form>
    </div>
  );
};

const KIND_LABEL = (method: Method) =>
  method.kind === "totp"
    ? "Autentiseringsapp"
    : method.passkey
      ? "Passkey, logger inn uten passord"
      : "Sikkerhetsnøkkel";

const MethodIcon = ({ method }: { method: Method }) => {
  const Icon = method.kind === "totp" ? GoDeviceMobile : method.passkey ? GoPasskeyFill : GoKey;
  return <Icon aria-hidden="true" className="text-foreground/70 mt-0.5 size-5 shrink-0" />;
};

/** One app or key: what it is, when it was used, rename and remove. */
const MethodRow = ({
  method,
  last,
  canChange,
  onChanged,
}: {
  method: Method;
  last: boolean;
  canChange: boolean;
  onChanged: () => void;
}) => {
  const [mode, setMode] = useState<"rename" | "remove" | null>(null);
  const [name, setName] = useState(method.name);
  const rename = useUser2faMethodsPartialUpdate();
  const remove = useUser2faMethodsDestroy();
  const added = date(method.createdAt);
  const used = date(method.lastUsedAt);

  return (
    <li className="flex flex-col gap-3 py-3">
      <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
        <MethodIcon method={method} />
        <div className="min-w-40 flex-1 text-sm">
          <p className="font-medium break-words">{method.name}</p>
          <p className="text-foreground/70">{KIND_LABEL(method)}</p>
          <p className="text-foreground/60 text-xs">
            {[added && `Lagt til ${added}`, used ? `sist brukt ${used}` : "ikke brukt ennå"]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        {canChange && mode === null && (
          <div className="ml-8 flex shrink-0 gap-1 sm:ml-0">
            <Button size="sm" variant="tertiary" onPress={() => setMode("rename")}>
              Gi nytt navn
            </Button>
            <Button size="sm" variant="tertiary" onPress={() => setMode("remove")}>
              Fjern
            </Button>
          </div>
        )}
      </div>
      {mode === "rename" && (
        <form
          className="flex flex-wrap items-end gap-2 pl-8"
          onSubmit={(event) => {
            event.preventDefault();
            rename.mutate(
              { method: method.id, data: { name } },
              { onSuccess: () => (setMode(null), onChanged()) },
            );
          }}
        >
          <div className="max-w-64 grow">
            <label className="mb-1 block text-sm font-medium" htmlFor={`rename-${method.id}`}>
              Navn
            </label>
            <Input
              id={`rename-${method.id}`}
              className="w-full"
              maxLength={64}
              required
              autoFocus
              defaultValue={method.name}
              onChange={(event) => setName(event.currentTarget.value)}
              aria-invalid={!!rename.error || undefined}
            />
            {rename.error && (
              <p className="text-danger mt-1 text-sm">{formatApiError(rename.error)}</p>
            )}
          </div>
          <Button type="submit" isPending={rename.isPending}>
            Lagre
          </Button>
          <Button variant="tertiary" onPress={() => setMode(null)}>
            Avbryt
          </Button>
        </form>
      )}
      {mode === "remove" && (
        <div className="flex flex-col gap-2 pl-8">
          <p className="text-sm">
            Fjerne «{method.name}»?
            {last &&
              " Det er den siste metoden, så totrinnsbekreftelse slås av og gjenopprettingskodene slettes."}
          </p>
          {remove.error && <FormError error={formatApiError(remove.error)} />}
          <div className="flex gap-2">
            <Button
              variant="danger"
              isPending={remove.isPending}
              onPress={() => remove.mutate({ method: method.id }, { onSuccess: onChanged })}
            >
              Fjern
            </Button>
            <Button variant="tertiary" onPress={() => setMode(null)}>
              Avbryt
            </Button>
          </div>
        </div>
      )}
    </li>
  );
};

/** Name it, then the browser asks for the key, fingerprint or face. */
const AddKey = ({
  onAdded,
  onCancel,
}: {
  onAdded: (_codes: readonly string[] | null) => void;
  onCancel: () => void;
}) => {
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        setPending(true);
        try {
          const { recoveryCodes } = await addKey(name.trim());
          onAdded(recoveryCodes);
        } catch (cause) {
          setError(message(cause));
        } finally {
          setPending(false);
        }
      }}
    >
      <p className="text-sm">
        En passkey lagres på telefonen, datamaskinen (Touch ID, Windows Hello) eller i
        passordbehandleren, og logger deg inn uten passord. En sikkerhetsnøkkel som YubiKey virker
        også.
      </p>
      <AuthField
        id="key-name"
        label="Navn, så du kjenner den igjen"
        placeholder="For eksempel MacBook eller YubiKey"
        className="max-w-64"
        maxLength={64}
        autoFocus
        onChange={(event) => setName(event.currentTarget.value)}
      />
      <FormError error={error} />
      <div className="flex gap-2">
        <Button type="submit" isPending={pending}>
          Fortsett
        </Button>
        <Button variant="tertiary" onPress={onCancel}>
          Avbryt
        </Button>
      </div>
    </form>
  );
};

/** Scan, type a code. */
const AddApp = ({
  onAdded,
  onCancel,
}: {
  onAdded: (_codes: readonly string[] | null) => void;
  onCancel: () => void;
}) => {
  const setup = useUser2faTotpSetupCreate();
  const confirm = useUser2faTotpConfirmCreate();
  const [pending, setPending] = useState<TwoFactorSetup | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  if (!pending) {
    return (
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setup.mutate(
            { data: { name: name.trim() } },
            { onSuccess: ({ data }) => setPending(data) },
          );
        }}
      >
        <p className="text-sm">
          En app på telefonen som viser en ny kode hvert halve minutt, for eksempel Google
          Authenticator, Microsoft Authenticator, 1Password, Bitwarden eller Authy.
        </p>
        <AuthField
          id="app-name"
          label="Navn, så du kjenner den igjen"
          placeholder="For eksempel Telefonen"
          className="max-w-64"
          maxLength={64}
          autoFocus
          onChange={(event) => setName(event.currentTarget.value)}
        />
        {setup.error && <FormError error={formatApiError(setup.error)} />}
        <div className="flex gap-2">
          <Button type="submit" isPending={setup.isPending}>
            Fortsett
          </Button>
          <Button variant="tertiary" onPress={onCancel}>
            Avbryt
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        confirm.mutate(
          { data: { code } },
          { onSuccess: ({ data }) => onAdded(data.recoveryCodes) },
        );
      }}
    >
      <ol className="flex list-decimal flex-col gap-4 pl-5 text-sm">
        <li>
          <p>Skann QR-koden med autentiseringsappen.</p>
          {/* An SVG data URI from our own API; next/image adds nothing here. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pending.qrCode}
            alt="QR-kode for autentiseringsappen"
            className="mt-2 size-44 rounded-lg bg-white p-2"
          />
          <p className="text-foreground/75 mt-2">
            Kan du ikke skanne? Skriv inn denne nøkkelen i appen:
          </p>
          <code className="bg-default-100 mt-1 inline-block rounded px-2 py-1 font-mono break-all">
            {grouped(pending.secret)}
          </code>
        </li>
        <li>
          <p>Skriv inn den sekssifrede koden appen viser.</p>
          <AuthField
            id="totp-confirm"
            label="Kode"
            className="mt-2 max-w-48"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            onChange={(event) => setCode(event.currentTarget.value)}
            isInvalid={!!confirm.error}
            errorMessage={confirm.error ? formatApiError(confirm.error) : undefined}
          />
        </li>
      </ol>
      <div className="flex gap-2">
        <Button type="submit" isPending={confirm.isPending}>
          Bekreft
        </Button>
        <Button variant="tertiary" onPress={onCancel}>
          Avbryt
        </Button>
      </div>
    </form>
  );
};

export const LoginMethodsSection = () => {
  const status = useUser2faRetrieve();
  const regenerate = useUser2faRecoveryCodesCreate();
  const webauthn = useWebAuthn();
  const [adding, setAdding] = useState<"key" | "app" | null>(null);
  const [fresh, setFresh] = useState<{ codes: readonly string[]; first: boolean } | null>(null);
  const refresh = () => void status.refetch();

  const added = (codes: readonly string[] | null) => {
    setAdding(null);
    if (codes) setFresh({ codes, first: true });
    refresh();
  };

  let body;
  if (fresh) {
    body = (
      <RecoveryCodes
        codes={fresh.codes}
        first={fresh.first}
        onDone={() => {
          setFresh(null);
          refresh();
        }}
      />
    );
  } else if (status.isPending) {
    body = <p className="text-foreground/60 text-sm">Henter …</p>;
  } else if (status.error) {
    body = <FormError error={formatApiError(status.error)} />;
  } else {
    const { enabled, verified, methods, recoveryCodesLeft } = status.data.data;
    const canChange = !enabled || verified;
    body = (
      <div className="flex flex-col gap-4">
        {enabled ? (
          <div className="flex items-start gap-2 text-sm">
            <GoShieldCheck aria-hidden="true" className="text-success-700 mt-0.5 shrink-0" />
            <p className="font-medium">Totrinnsbekreftelse er på.</p>
          </div>
        ) : (
          <p className="text-sm">
            Du logger inn med passord. Legg til en passkey for å logge inn uten passord, eller en
            app eller nøkkel som ekstra steg etter passordet. Valgfritt, men anbefalt.
          </p>
        )}

        {enabled && !verified && (
          <VerifyFirst
            withKey={webauthn && methods.some((m) => m.kind === "webauthn")}
            onVerified={refresh}
          />
        )}

        {methods.length > 0 && (
          <ul className="divide-foreground/10 divide-y">
            {methods.map((method) => (
              <MethodRow
                key={method.id}
                method={method}
                last={methods.length === 1}
                canChange={canChange}
                onChanged={refresh}
              />
            ))}
          </ul>
        )}

        {canChange &&
          (adding === "key" ? (
            <AddKey onAdded={added} onCancel={() => setAdding(null)} />
          ) : adding === "app" ? (
            <AddApp onAdded={added} onCancel={() => setAdding(null)} />
          ) : (
            <div className="flex flex-wrap gap-2">
              {webauthn && (
                <Button onPress={() => setAdding("key")}>
                  <GoPasskeyFill aria-hidden="true" />
                  Legg til passkey eller sikkerhetsnøkkel
                </Button>
              )}
              <Button variant="tertiary" onPress={() => setAdding("app")}>
                <GoDeviceMobile aria-hidden="true" />
                Legg til autentiseringsapp
              </Button>
            </div>
          ))}

        {enabled && (
          <div className="border-foreground/10 flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-sm">
            <p className={recoveryCodesLeft === 0 ? "text-danger" : "text-foreground/75"}>
              {recoveryCodesLeft === 0
                ? "Du har ingen gjenopprettingskoder igjen. Lag nye, så du ikke blir stengt ute."
                : `${recoveryCodesLeft} gjenopprettingskoder igjen.`}
            </p>
            {verified && (
              <Button
                size="sm"
                variant="tertiary"
                isPending={regenerate.isPending}
                onPress={() =>
                  regenerate.mutate(undefined, {
                    onSuccess: ({ data }) => setFresh({ codes: data.recoveryCodes, first: false }),
                  })
                }
              >
                Lag nye koder
              </Button>
            )}
            {regenerate.error && <FormError error={formatApiError(regenerate.error)} />}
          </div>
        )}
      </div>
    );
  }

  return (
    <ProfileCard
      id="login-methods-heading"
      title="Innlogging og totrinnsbekreftelse"
      description="Passkeys, sikkerhetsnøkler og autentiseringsapper."
    >
      {body}
    </ProfileCard>
  );
};
