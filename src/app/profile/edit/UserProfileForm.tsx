"use client";
import { User, UserRequest } from "@/generated/frikanalenDjangoAPI.schemas";
import cx from "classnames";
import { Button, Form, Input } from "@heroui/react";
import { useForm } from "react-hook-form";
import { useUserUpdate } from "@/generated/user/user";

export const UserProfileForm = ({ user, className }: { user: User; className?: string }) => {
  const { mutateAsync } = useUserUpdate({ request: { withCredentials: true } });
  const { register, handleSubmit } = useForm<UserRequest>({ defaultValues: { ...user } });

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
        <Input {...register("firstName")} label={"Fornavn"} labelPlacement={"outside-top"} />
        <Input {...register("lastName")} label={"Etternavn"} labelPlacement={"outside-top"} />
        <Input
          {...register("phoneNumber")}
          label={"Telefonnummer"}
          labelPlacement={"outside-top"}
        />
      </div>
      <div className={"ml-auto w-fit py-4"}>
        <Button type={"submit"}>Lagre</Button>
      </div>
    </Form>
  );
};
