"use client";
import { NewUserRequest } from "@/generated/frikanalenDjangoAPI.schemas";
import cx from "classnames";
import { Button, Form, Input } from "@heroui/react";
import { useForm } from "react-hook-form";
import { useUserRegisterCreate } from "@/generated/user/user";

export const UserRegisterForm = ({ className }: { className?: string }) => {
  const { mutateAsync } = useUserRegisterCreate();
  const { register, handleSubmit } = useForm<NewUserRequest>();

  return (
    <Form
      className={cx("block", className)}
      onSubmit={handleSubmit(async (data) => {
        await mutateAsync({ data });
        // we force a refresh because profile data is rendered server-side
        window.location.assign("/profile");
      })}
    >
      <div className="flex flex-col gap-4">
        <Input
          {...register("email")}
          label={"Epost (brukernavn)"}
          labelPlacement={"outside-top"}
          autoComplete={"section-register username"}
        />
        <Input
          autoComplete={"section-register given-name"}
          {...register("firstName")}
          label={"Fornavn"}
          labelPlacement={"outside-top"}
        />
        <Input
          autoComplete={"section-register family-name"}
          {...register("lastName")}
          label={"Etternavn"}
          labelPlacement={"outside-top"}
        />
        <Input
          {...register("password")}
          label={"Passord"}
          type={"password"}
          autoComplete={"section-register new-password"}
          labelPlacement={"outside-top"}
        />
      </div>
      <div className={"ml-auto w-fit py-4"}>
        <Button type={"submit"}>Registrer deg</Button>
      </div>
    </Form>
  );
};
