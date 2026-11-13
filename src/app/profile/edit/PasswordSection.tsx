"use client";
import { AuthField } from "@/components/form/AuthField";
import { FormError } from "@/components/form/FormError";
import { MIN_SCORE, TOO_WEAK, usePasswordStrength } from "@/components/password/strength";
import { PasswordStrengthMeter } from "@/components/password/PasswordStrengthMeter";
import { useUserPasswordCreate, useUserPasswordResetCreate } from "@/generated/user/user";
import { formatApiError } from "@/lib/formatApiError";
import { useApiFormSubmit } from "@/lib/useApiFormSubmit";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Form } from "@heroui/react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { GoCheck } from "react-icons/go";
import z from "zod";
import { ProfileCard } from "@/app/profile/edit/ProfileCard";

// Django checks the new password properly; the length is repeated here only
// because Django's own message for it is not translated.
const PasswordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Skriv inn passordet du har nå."),
    newPassword: z.string().min(10, "Passordet må ha minst 10 tegn."),
    repeatPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.repeatPassword, {
    message: "Passordene er ikke like.",
    path: ["repeatPassword"],
  });

type PasswordChange = z.infer<typeof PasswordChangeSchema>;

/** For someone who is signed in but no longer knows the password. */
const SendResetLink = ({ email }: { email: string }) => {
  const { mutate, isPending, isSuccess, error } = useUserPasswordResetCreate();

  if (isSuccess) {
    return (
      <p role="status" className="text-sm">
        Vi har sendt en lenke til <strong>{email}</strong>. Den virker i én time.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-foreground/75 text-sm">
        Husker du ikke passordet du har nå? Vi kan sende en lenke til {email} der du velger et nytt.
      </p>
      <Button
        variant="tertiary"
        className="w-fit"
        isPending={isPending}
        onPress={() => mutate({ data: { email } })}
      >
        Send lenke på e-post
      </Button>
      {error && (
        <p role="alert" className="text-danger-700 text-sm">
          {formatApiError(error)}
        </p>
      )}
    </div>
  );
};

export const PasswordSection = ({ email }: { email: string }) => {
  const form = useForm<PasswordChange>({ resolver: zodResolver(PasswordChangeSchema) });
  const { register, formState, reset, setError } = form;
  const score = usePasswordStrength(
    useWatch({ control: form.control, name: "newPassword" }) ?? "",
    [email],
  );
  const { mutateAsync } = useUserPasswordCreate({ request: { withCredentials: true } });
  const [changed, setChanged] = useState(false);

  const { onSubmit, error, isSubmitting } = useApiFormSubmit(form, async (data) => {
    setChanged(false);
    if (score !== null && score < MIN_SCORE) {
      setError("newPassword", { message: TOO_WEAK });
      return;
    }
    await mutateAsync({
      data: { currentPassword: data.currentPassword, newPassword: data.newPassword },
    });
    reset({ currentPassword: "", newPassword: "", repeatPassword: "" });
    setChanged(true);
  });

  return (
    <ProfileCard
      id="password-heading"
      title="Passord"
      description="Når du bytter passord, blir du logget ut på alle andre enheter."
    >
      <Form className="flex flex-col gap-4" onSubmit={onSubmit}>
        {/* Lets a password manager tie the new password to the right account. */}
        <input type="text" name="username" autoComplete="username" value={email} readOnly hidden />
        <FormError error={error} />
        {changed && (
          <p role="status" className="text-success-700 inline-flex items-center gap-1 text-sm">
            <GoCheck aria-hidden="true" />
            Passordet er byttet. Vi har sendt deg en bekreftelse på e-post.
          </p>
        )}
        <AuthField
          {...register("currentPassword")}
          id="current-password"
          required
          label="Nåværende passord"
          type="password"
          autoComplete="current-password"
          isInvalid={!!formState.errors.currentPassword}
          errorMessage={formState.errors.currentPassword?.message}
        />
        <AuthField
          {...register("newPassword")}
          id="new-password"
          required
          label="Nytt passord"
          type="password"
          autoComplete="new-password"
          isInvalid={!!formState.errors.newPassword}
          errorMessage={formState.errors.newPassword?.message}
        />
        <PasswordStrengthMeter score={score} />
        <AuthField
          {...register("repeatPassword")}
          id="repeat-password"
          required
          label="Gjenta nytt passord"
          type="password"
          autoComplete="new-password"
          isInvalid={!!formState.errors.repeatPassword}
          errorMessage={formState.errors.repeatPassword?.message}
        />
        <div className="flex justify-end">
          <Button type="submit" isPending={isSubmitting}>
            Bytt passord
          </Button>
        </div>
      </Form>
      <hr className="border-default-200 my-5" />
      <SendResetLink email={email} />
    </ProfileCard>
  );
};
