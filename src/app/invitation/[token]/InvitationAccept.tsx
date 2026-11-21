"use client";
import { Button, Form } from "@heroui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { AuthField } from "@/components/form/AuthField";
import { FormError } from "@/components/form/FormError";
import { MIN_SCORE, TOO_WEAK, usePasswordStrength } from "@/components/password/strength";
import { PasswordStrengthMeter } from "@/components/password/PasswordStrengthMeter";
import type {
  AcceptInvitationRequest,
  InvitationPreview,
} from "@/generated/frikanalenDjangoAPI.schemas";
import { useInvitationsAcceptCreate } from "@/generated/invitations/invitations";
import { formatApiError } from "@/lib/formatApiError";
import { useApiFormSubmit } from "@/lib/useApiFormSubmit";

const studioOf = (invitation: InvitationPreview) =>
  `/organization/${invitation.organizationId}/admin`;

/** Logged in: one button. */
const Join = ({
  token,
  invitation,
  email,
}: {
  token: string;
  invitation: InvitationPreview;
  email: string;
}) => {
  const router = useRouter();
  const { mutateAsync, isPending } = useInvitationsAcceptCreate();
  const [error, setError] = useState<string | null>(null);
  const join = async () => {
    setError(null);
    try {
      await mutateAsync({ token, data: {} });
      router.push(studioOf(invitation));
      router.refresh();
    } catch (cause) {
      setError(formatApiError(cause));
    }
  };
  const otherAddress = !!invitation.email && email.toLowerCase() !== invitation.email.toLowerCase();

  return (
    <div className="mt-5 space-y-3">
      <FormError error={error} />
      <p className="text-default-700">
        Du er logget inn som <strong className="break-all">{email}</strong>.
        {otherAddress ? (
          <> Invitasjonen ble sendt til {invitation.email}, men du kan bli med som deg selv.</>
        ) : null}
      </p>
      <Button isPending={isPending} onPress={() => void join()}>
        Bli med i {invitation.organizationName}
      </Button>
    </div>
  );
};

/** No session: make an account with the invited address, and join. */
const SignUp = ({ token, invitation }: { token: string; invitation: InvitationPreview }) => {
  const router = useRouter();
  const { mutateAsync } = useInvitationsAcceptCreate();
  const form = useForm<Required<AcceptInvitationRequest>>();
  const { register, formState, setError } = form;
  const score = usePasswordStrength(useWatch({ control: form.control, name: "password" }) ?? "", [
    useWatch({ control: form.control, name: "email" }) || invitation.email,
    useWatch({ control: form.control, name: "firstName" }) ?? "",
    useWatch({ control: form.control, name: "lastName" }) ?? "",
  ]);
  const { onSubmit, error, isSubmitting } = useApiFormSubmit(form, async (data) => {
    if (score !== null && score < MIN_SCORE) {
      setError("password", { message: TOO_WEAK });
      return;
    }
    // An e-mailed invitation already knows the address.
    await mutateAsync({ token, data: invitation.email ? { ...data, email: undefined } : data });
    router.push(studioOf(invitation));
    router.refresh();
  });
  const back = `/invitation/${token}`;

  return (
    <div className="mt-5 space-y-6">
      <Form className="block" onSubmit={onSubmit} aria-label="Lag bruker og bli med">
        <div className="flex flex-col gap-4">
          <FormError error={error} />
          {invitation.email ? (
            <div>
              <p className="text-sm font-medium">E-post (brukernavn)</p>
              <p className="mt-1 break-all">{invitation.email}</p>
            </div>
          ) : (
            // A link handed over in person has no address of its own.
            <AuthField
              id="email"
              {...register("email", { required: "Fyll inn e-postadressen din." })}
              type="email"
              label="E-post (brukernavn)"
              autoComplete="username"
              required
            />
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AuthField
              id="firstName"
              {...register("firstName", { required: "Fyll inn fornavnet ditt." })}
              autoComplete="given-name"
              label="Fornavn"
              required
            />
            <AuthField
              id="lastName"
              {...register("lastName", { required: "Fyll inn etternavnet ditt." })}
              autoComplete="family-name"
              label="Etternavn"
              required
            />
          </div>
          <AuthField
            id="password"
            {...register("password", {
              minLength: { value: 10, message: "Passordet må ha minst 10 tegn." },
            })}
            label="Velg et passord"
            type="password"
            autoComplete="new-password"
            required
            isInvalid={!!formState.errors.password}
            errorMessage={formState.errors.password?.message}
          />
          <PasswordStrengthMeter score={score} />
          <div className="ml-auto">
            <Button type="submit" isPending={isSubmitting}>
              Lag bruker og bli med
            </Button>
          </div>
        </div>
      </Form>
      <p className="border-t border-default-200 pt-4 text-default-700">
        Har du allerede en bruker?{" "}
        <Link
          className="text-link hover:underline"
          href={`/login?next=${encodeURIComponent(back)}`}
        >
          Logg inn
        </Link>
        , så kommer du tilbake hit.
      </p>
    </div>
  );
};

export const InvitationAccept = ({
  token,
  invitation,
  user,
}: {
  token: string;
  invitation: InvitationPreview;
  user: { email: string } | null;
}) => (
  <>
    <p className="text-sm text-default-600">Invitasjon</p>
    <h1 className="text-2xl font-bold break-words">Bli med i {invitation.organizationName}</h1>
    <p className="mt-2 text-default-700">
      {invitation.invitedBy} har invitert deg til å bli medlem. Som medlem laster du opp videoer og
      setter opp sendinger på vegne av organisasjonen.
    </p>
    {user ? (
      <Join token={token} invitation={invitation} email={user.email} />
    ) : (
      <SignUp token={token} invitation={invitation} />
    )}
  </>
);
