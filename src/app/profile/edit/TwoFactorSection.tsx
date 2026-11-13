"use client";
import { Button } from "@heroui/react";
import { useState } from "react";
import { GoCheck, GoShieldCheck } from "react-icons/go";
import { AuthField } from "@/components/form/AuthField";
import { FormError } from "@/components/form/FormError";
import type { TwoFactorSetup } from "@/generated/frikanalenDjangoAPI.schemas";
import {
  useUser2faConfirmCreate,
  useUser2faDisableCreate,
  useUser2faRecoveryCodesCreate,
  useUser2faRetrieve,
  useUser2faSetupCreate,
} from "@/generated/user/user";
import { formatApiError } from "@/lib/formatApiError";
import { ProfileCard } from "@/app/profile/edit/ProfileCard";

const withCredentials = { request: { withCredentials: true } } as const;

/** The secret in groups of four, the way apps ask for it to be typed. */
const grouped = (secret: string) => secret.match(/.{1,4}/g)?.join(" ") ?? secret;

/** Shown once, right after they are made: the API never returns them again. */
const RecoveryCodes = ({ codes, onDone }: { codes: string[]; onDone: () => void }) => {
  const [copied, setCopied] = useState(false);
  const text = codes.join("\n");
  const download = `data:text/plain;charset=utf-8,${encodeURIComponent(
    `Gjenopprettingskoder for Frikanalen\nHver kode virker én gang.\n\n${text}\n`,
  )}`;

  return (
    <div className="flex flex-col gap-4">
      <div role="status" className="text-success-700 inline-flex items-center gap-1.5 text-sm">
        <GoCheck aria-hidden="true" />
        Totrinnsbekreftelse er slått på.
      </div>
      <div>
        <h3 className="font-semibold">Gjenopprettingskoder</h3>
        <p className="text-foreground/75 mt-1 text-sm">
          Mister du telefonen, kan du logge inn med en av disse i stedet for en kode fra appen. Hver
          kode virker én gang. Ta vare på dem nå, for de vises ikke igjen.
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

/** Off → scan, type a code → recovery codes. */
const TurnOn = ({ onEnabled }: { onEnabled: (_codes: string[]) => void }) => {
  const setup = useUser2faSetupCreate(withCredentials);
  const confirm = useUser2faConfirmCreate(withCredentials);
  const [pending, setPending] = useState<TwoFactorSetup | null>(null);
  const [code, setCode] = useState("");

  if (!pending) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm">
          Med totrinnsbekreftelse trenger du både passordet og en kode fra en app på telefonen for å
          logge inn, for eksempel Google Authenticator, Microsoft Authenticator eller 1Password.
        </p>
        {setup.error && <FormError error={formatApiError(setup.error)} />}
        <Button
          className="w-fit"
          isPending={setup.isPending}
          onPress={() => setup.mutate(undefined, { onSuccess: ({ data }) => setPending(data) })}
        >
          Slå på totrinnsbekreftelse
        </Button>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        confirm.mutate(
          { data: { code } },
          { onSuccess: ({ data }) => onEnabled([...data.recoveryCodes]) },
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
        <Button variant="tertiary" onPress={() => setPending(null)}>
          Avbryt
        </Button>
      </div>
    </form>
  );
};

/** One action that takes a current code: new recovery codes, or turning off. */
const WithCode = ({
  id,
  label,
  confirmLabel,
  danger,
  isPending,
  error,
  onSubmit,
  onCancel,
}: {
  id: string;
  label: string;
  confirmLabel: string;
  danger?: boolean;
  isPending: boolean;
  error: unknown;
  onSubmit: (_code: string) => void;
  onCancel: () => void;
}) => {
  const [code, setCode] = useState("");
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(code);
      }}
    >
      <AuthField
        id={id}
        label={label}
        className="max-w-64"
        autoComplete="one-time-code"
        autoFocus
        required
        onChange={(event) => setCode(event.currentTarget.value)}
        isInvalid={!!error}
        errorMessage={error ? formatApiError(error) : undefined}
      />
      <div className="flex gap-2">
        <Button type="submit" variant={danger ? "danger" : "primary"} isPending={isPending}>
          {confirmLabel}
        </Button>
        <Button variant="tertiary" onPress={onCancel}>
          Avbryt
        </Button>
      </div>
    </form>
  );
};

const IsOn = ({
  codesLeft,
  onChanged,
  onNewCodes,
}: {
  codesLeft: number;
  onChanged: () => void;
  onNewCodes: (_codes: string[]) => void;
}) => {
  const [action, setAction] = useState<"codes" | "off" | null>(null);
  const disable = useUser2faDisableCreate(withCredentials);
  const regenerate = useUser2faRecoveryCodesCreate(withCredentials);
  const label = "Kode fra appen eller en gjenopprettingskode";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-2">
        <GoShieldCheck aria-hidden="true" className="text-success-700 mt-0.5 shrink-0" />
        <div className="text-sm">
          <p className="font-medium">Totrinnsbekreftelse er på.</p>
          <p className="text-foreground/75">
            {codesLeft === 0
              ? "Du har ingen gjenopprettingskoder igjen. Lag nye, så du ikke blir stengt ute om du mister telefonen."
              : `${codesLeft} gjenopprettingskoder igjen.`}
          </p>
        </div>
      </div>
      {action === "codes" ? (
        <WithCode
          id="regenerate-code"
          label={label}
          confirmLabel="Lag nye koder"
          isPending={regenerate.isPending}
          error={regenerate.error}
          onCancel={() => setAction(null)}
          onSubmit={(code) =>
            regenerate.mutate(
              { data: { code } },
              { onSuccess: ({ data }) => onNewCodes([...data.recoveryCodes]) },
            )
          }
        />
      ) : action === "off" ? (
        <WithCode
          id="disable-code"
          label={label}
          confirmLabel="Slå av"
          danger
          isPending={disable.isPending}
          error={disable.error}
          onCancel={() => setAction(null)}
          onSubmit={(code) => disable.mutate({ data: { code } }, { onSuccess: onChanged })}
        />
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button variant="tertiary" onPress={() => setAction("codes")}>
            Nye gjenopprettingskoder
          </Button>
          <Button variant="tertiary" onPress={() => setAction("off")}>
            Slå av
          </Button>
        </div>
      )}
    </div>
  );
};

export const TwoFactorSection = () => {
  const status = useUser2faRetrieve(withCredentials);
  const [freshCodes, setFreshCodes] = useState<string[] | null>(null);
  const refresh = () => void status.refetch();

  return (
    <ProfileCard
      id="two-factor-heading"
      title="Totrinnsbekreftelse"
      description="En kode fra en app på telefonen i tillegg til passordet. Valgfritt, men anbefalt."
    >
      {freshCodes ? (
        <RecoveryCodes
          codes={freshCodes}
          onDone={() => {
            setFreshCodes(null);
            refresh();
          }}
        />
      ) : status.isPending ? (
        <p className="text-foreground/60 text-sm">Henter …</p>
      ) : status.error ? (
        <FormError error={formatApiError(status.error)} />
      ) : status.data.data.enabled ? (
        <IsOn
          codesLeft={status.data.data.recoveryCodesLeft}
          onChanged={refresh}
          onNewCodes={setFreshCodes}
        />
      ) : (
        <TurnOn onEnabled={setFreshCodes} />
      )}
    </ProfileCard>
  );
};
