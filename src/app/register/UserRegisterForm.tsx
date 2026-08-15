"use client";
import { NewUserRequest } from "@/generated/frikanalenDjangoAPI.schemas";
import cx from "classnames";
import { Button, Form, Input } from "@heroui/react";
import { useForm } from "react-hook-form";
import { useUserRegisterCreate } from "@/generated/user/user";
import { useApiFormSubmit } from "@/lib/useApiFormSubmit";
import { FormError } from "@/components/form/FormError";

export const UserRegisterForm = ({ className }: { className?: string }) => {
  const { mutateAsync } = useUserRegisterCreate();
  const form = useForm<NewUserRequest>({
    defaultValues: { email: "", firstName: "", lastName: "", password: "" },
  });
  const { register } = form;

  const { onSubmit, error, isSubmitting } = useApiFormSubmit(form, async (data) => {
    await mutateAsync({ data });
    // we force a refresh because profile data is rendered server-side
    window.location.assign("/profile");
  });

  return (
    <Form className={cx("block", className)} onSubmit={onSubmit}>
      <div className="flex flex-col gap-4">
        <FormError error={error} />
        <Input
          {...register("email")}
          type={"email"}
          label={"Epost (brukernavn)"}
          labelPlacement={"outside-top"}
          autoComplete={"username"}
          isRequired
        />
        <Input
          {...register("firstName")}
          autoComplete={"given-name"}
          label={"Fornavn"}
          labelPlacement={"outside-top"}
          isRequired
        />
        <Input
          {...register("lastName")}
          autoComplete={"family-name"}
          label={"Etternavn"}
          labelPlacement={"outside-top"}
          isRequired
        />
        <Input
          {...register("password")}
          label={"Passord"}
          type={"password"}
          autoComplete={"new-password"}
          labelPlacement={"outside-top"}
          isRequired
        />
      </div>
      <div className={"ml-auto w-fit py-4"}>
        <Button type={"submit"} isLoading={isSubmitting}>
          Registrer deg
        </Button>
      </div>
    </Form>
  );
};
