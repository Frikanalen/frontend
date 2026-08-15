"use client";
import { User, UserRequest } from "@/generated/frikanalenDjangoAPI.schemas";
import cx from "classnames";
import { Button, Form, Input } from "@heroui/react";
import { useForm } from "react-hook-form";
import { useUserUpdate } from "@/generated/user/user";
import { useApiFormSubmit } from "@/lib/useApiFormSubmit";
import { FormError } from "@/components/form/FormError";

export const UserProfileForm = ({ user, className }: { user: User; className?: string }) => {
  const { mutateAsync } = useUserUpdate({ request: { withCredentials: true } });
  const form = useForm<UserRequest>({ defaultValues: { ...user } });
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
          id="firstName"
          {...register("firstName")}
          autoComplete={"given-name"}
          label={"Fornavn"}
          labelPlacement={"outside-top"}
        />
        <Input
          id="lastName"
          {...register("lastName")}
          autoComplete={"family-name"}
          label={"Etternavn"}
          labelPlacement={"outside-top"}
        />
        <Input
          id="phoneNumber"
          {...register("phoneNumber")}
          type={"tel"}
          autoComplete={"tel"}
          label={"Telefonnummer"}
          labelPlacement={"outside-top"}
        />
      </div>
      <div className={"ml-auto w-fit py-4"}>
        <Button type={"submit"} isLoading={isSubmitting}>
          Lagre
        </Button>
      </div>
    </Form>
  );
};
