"use client";
import { AuthField } from "@/components/form/AuthField";
import { NewUserRequest } from "@/generated/frikanalenDjangoAPI.schemas";
import cx from "classnames";
import { Button, Form } from "@heroui/react";
import { useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useUserRegisterCreate } from "@/generated/user/user";
import { useApiFormSubmit } from "@/lib/useApiFormSubmit";
import { FormError } from "@/components/form/FormError";
import { MIN_SCORE, TOO_WEAK, usePasswordStrength } from "@/components/password/strength";
import { PasswordStrengthMeter } from "@/components/password/PasswordStrengthMeter";

export const UserRegisterForm = ({ className }: { className?: string }) => {
  const router = useRouter();
  const { mutateAsync } = useUserRegisterCreate();
  const form = useForm<NewUserRequest>();
  const { register, formState, setError } = form;
  const score = usePasswordStrength(useWatch({ control: form.control, name: "password" }) ?? "", [
    useWatch({ control: form.control, name: "email" }) ?? "",
    useWatch({ control: form.control, name: "firstName" }) ?? "",
    useWatch({ control: form.control, name: "lastName" }) ?? "",
  ]);

  const { onSubmit, error, isSubmitting } = useApiFormSubmit(form, async (data) => {
    if (score !== null && score < MIN_SCORE) {
      setError("password", { message: TOO_WEAK });
      return;
    }
    await mutateAsync({ data });
    // we force a refresh because profile data is rendered server-side
    router.push("/profile");
    router.refresh();
  });

  return (
    <Form className={cx("block", className)} onSubmit={onSubmit}>
      <div className="flex flex-col gap-4">
        <FormError error={error} />
        <AuthField
          id="email"
          {...register("email")}
          type={"email"}
          label={"Epost (brukernavn)"}
          autoComplete={"username"}
          required
        />
        <AuthField
          id="firstName"
          {...register("firstName")}
          autoComplete={"given-name"}
          label={"Fornavn"}
          required
        />
        <AuthField
          id="lastName"
          {...register("lastName")}
          autoComplete={"family-name"}
          label={"Etternavn"}
          required
        />
        <AuthField
          id="password"
          {...register("password", {
            // The backend runs Django's full password checks; the length is
            // repeated here so the commonest miss gets a Norwegian answer
            // before the round trip (Django's own length message isn't
            // translated).
            minLength: { value: 10, message: "Passordet må ha minst 10 tegn." },
          })}
          label={"Passord"}
          type={"password"}
          autoComplete={"new-password"}
          required
          isInvalid={!!formState.errors.password}
          errorMessage={formState.errors.password?.message}
        />
        <PasswordStrengthMeter score={score} />
      </div>
      <div className={"ml-auto w-fit py-4"}>
        <Button type={"submit"} isPending={isSubmitting}>
          Registrer deg
        </Button>
      </div>
    </Form>
  );
};
