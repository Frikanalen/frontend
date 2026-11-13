"use client";
import { AuthField } from "@/components/form/AuthField";
import { Button, Form } from "@heroui/react";
import { ButtonLink } from "@/components/ButtonLink";
import Link from "next/link";
import { useRouter } from "next/navigation";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUserLoginCreate } from "@/generated/user/user";
import type { LoginRequest } from "@/generated/frikanalenDjangoAPI.schemas";
import { useApiFormSubmit } from "@/lib/useApiFormSubmit";
import { FormError } from "@/components/form/FormError";
import { OtpField } from "@/components/form/OtpField";
import { apiErrorCode } from "@/lib/apiErrorCode";
import { SecurityKeyStep } from "@/components/form/SecurityKeyStep";
import { PasskeyLogin } from "@/app/login/PasskeyLogin";
import { hasSecurityKey } from "@/lib/webauthn";
import { useCallback, useState } from "react";

const UserLoginFormSchema = z.object({
  email: z.email("Skriv inn en gyldig e-postadresse."),
  password: z.string().min(1, "Skriv inn passordet ditt."),
  otp: z.string().optional(),
});

export default function Login() {
  const router = useRouter();
  const form = useForm<LoginRequest>({
    resolver: zodResolver(UserLoginFormSchema),
  });
  const { register, formState } = form;
  const { mutateAsync } = useUserLoginCreate();
  // Set once the API says this account has two-factor on: whether it can
  // use a security key, or only a code.
  const [secondStep, setSecondStep] = useState<"code" | "key" | null>(null);

  const loggedIn = useCallback(() => {
    // we force a refresh because profile data is rendered server-side
    router.push("/profile");
    router.refresh();
  }, [router]);

  const { onSubmit, error, isSubmitting } = useApiFormSubmit(form, async (data) => {
    try {
      // An empty code field means no code (a key may have done the step).
      await mutateAsync({ data: { ...data, otp: data.otp || undefined } });
    } catch (cause) {
      if (apiErrorCode(cause, "otp") === "otp_required") {
        setSecondStep((await hasSecurityKey().catch(() => false)) ? "key" : "code");
        return;
      }
      throw cause;
    }
    loggedIn();
  });

  return (
    <section className={"mx-4 mt-10 w-[calc(100%-2rem)] max-w-3xl bg-background p-6 sm:p-8"}>
      <div className={"grid grid-cols-1 gap-8 sm:grid-cols-2"}>
        <div>
          <Form onSubmit={onSubmit}>
            <div className={"flex flex-col gap-4 w-full"}>
              <h1 className={"text-2xl font-bold"}>Logg inn</h1>
              <FormError error={error} />
              <AuthField
                {...register("email")}
                id="login-email"
                required
                label="E-post"
                type="email"
                autoComplete={"username webauthn"}
                isInvalid={!!formState.errors.email}
                errorMessage={formState.errors.email?.message}
              />
              <AuthField
                {...register("password")}
                id="login-password"
                required
                label="Passord"
                type="password"
                autoComplete={"current-password"}
                isInvalid={!!formState.errors.password}
                errorMessage={formState.errors.password?.message}
              />
              {secondStep === "key" && <SecurityKeyStep onPassed={() => onSubmit()} />}
              {secondStep && <OtpField {...register("otp")} withKey={secondStep === "key"} />}
              <div className={"flex items-center justify-between gap-4"}>
                <Link href={"/password-reset"} className={"text-sm underline"}>
                  Glemt passordet?
                </Link>
                <Button type="submit" isPending={isSubmitting}>
                  Logg inn
                </Button>
              </div>
            </div>
          </Form>
          <PasskeyLogin onLoggedIn={loggedIn} />
        </div>
        <div className={"space-y-4 flex flex-col justify-between"}>
          <h2 className={"text-2xl font-bold"}>Ny her?</h2>
          <div className={""}>
            En profil kan brukes til å personalisere din brukeropplevelse. En bruker er også
            nødvendig for å administrere medlemskap.
          </div>
          <div className={"ml-auto"}>
            <ButtonLink href={"/register"}>Registrer bruker</ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
