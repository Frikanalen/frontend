"use client";
import { AuthField } from "@/components/form/AuthField";
import { FormError } from "@/components/form/FormError";
import { OtpField } from "@/components/form/OtpField";
import { apiErrorCode } from "@/lib/apiErrorCode";
import { MIN_SCORE, TOO_WEAK, usePasswordStrength } from "@/components/password/strength";
import { PasswordStrengthMeter } from "@/components/password/PasswordStrengthMeter";
import { useUserPasswordResetConfirmCreate } from "@/generated/user/user";
import { useApiFormSubmit } from "@/lib/useApiFormSubmit";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Form } from "@heroui/react";
import { isAxiosError } from "axios";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import z from "zod";

// Django checks the password properly (AUTH_PASSWORD_VALIDATORS); the length
// is repeated here only so the commonest mistake gets a Norwegian answer
// before the round trip.
const NewPasswordSchema = z
  .object({
    newPassword: z.string().min(10, "Passordet må ha minst 10 tegn."),
    repeatPassword: z.string(),
    otp: z.string().optional(),
  })
  .refine((data) => data.newPassword === data.repeatPassword, {
    message: "Passordene er ikke like.",
    path: ["repeatPassword"],
  });

type NewPassword = z.infer<typeof NewPasswordSchema>;

/** The API refuses a used, expired or mangled link on the `token` field. */
const isBadLink = (cause: unknown) =>
  isAxiosError(cause) &&
  cause.response?.status === 400 &&
  Array.isArray(cause.response.data?.errors) &&
  cause.response.data.errors.some((entry: { attr?: string }) => entry.attr === "token");

export default function PasswordResetConfirmPage() {
  const { uid, token } = useParams<{ uid: string; token: string }>();
  const router = useRouter();
  const form = useForm<NewPassword>({ resolver: zodResolver(NewPasswordSchema) });
  const { register, formState, setError } = form;
  const score = usePasswordStrength(useWatch({ control: form.control, name: "newPassword" }) ?? "");
  const { mutateAsync } = useUserPasswordResetConfirmCreate();
  const [badLink, setBadLink] = useState(false);
  // Set once the API says this account has two-factor on.
  const [needsCode, setNeedsCode] = useState(false);

  const { onSubmit, error, isSubmitting } = useApiFormSubmit(form, async (data) => {
    if (score !== null && score < MIN_SCORE) {
      setError("newPassword", { message: TOO_WEAK });
      return;
    }
    try {
      await mutateAsync({ data: { uid, token, newPassword: data.newPassword, otp: data.otp } });
    } catch (cause) {
      if (apiErrorCode(cause, "otp") === "otp_required") {
        setNeedsCode(true);
        return;
      }
      if (isBadLink(cause)) {
        setBadLink(true);
        return;
      }
      throw cause;
    }
    // The API has logged us in; profile data is rendered server-side.
    router.push("/profile");
    router.refresh();
  });

  if (badLink) {
    return (
      <div className={"flex flex-col gap-4"} role="alert">
        <h1 className={"text-2xl font-bold"}>Lenken virker ikke</h1>
        <p>
          Lenken er brukt, utløpt eller ufullstendig. En lenke virker i én time, og bare én gang.
        </p>
        <Link href={"/password-reset"} className={"underline"}>
          Be om en ny lenke
        </Link>
      </div>
    );
  }

  return (
    <Form onSubmit={onSubmit}>
      <div className={"flex flex-col gap-4 w-full"}>
        <h1 className={"text-2xl font-bold"}>Velg nytt passord</h1>
        <FormError error={error} />
        <AuthField
          {...register("newPassword")}
          id="new-password"
          required
          label="Nytt passord"
          type="password"
          autoComplete={"new-password"}
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
          autoComplete={"new-password"}
          isInvalid={!!formState.errors.repeatPassword}
          errorMessage={formState.errors.repeatPassword?.message}
        />
        {needsCode && <OtpField {...register("otp")} />}
        <Button className={"ml-auto"} type="submit" isPending={isSubmitting}>
          Lagre passord
        </Button>
      </div>
    </Form>
  );
}
