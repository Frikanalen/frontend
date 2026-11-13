"use client";
import { AuthField } from "@/components/form/AuthField";
import { User, UserRequest } from "@/generated/frikanalenDjangoAPI.schemas";
import { Button, Form } from "@heroui/react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GoCheck } from "react-icons/go";
import { useUserPartialUpdate } from "@/generated/user/user";
import { useApiFormSubmit } from "@/lib/useApiFormSubmit";
import { FormError } from "@/components/form/FormError";
import { ProfileCard } from "@/app/profile/edit/ProfileCard";

export const UserProfileForm = ({ user }: { user: User }) => {
  const router = useRouter();
  const { mutateAsync } = useUserPartialUpdate({ request: { withCredentials: true } });
  const form = useForm<UserRequest>({
    defaultValues: {
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      phoneNumber: user.phoneNumber ?? "",
    },
  });
  const { register, formState, reset } = form;
  const [saved, setSaved] = useState(false);

  const { onSubmit, error, isSubmitting } = useApiFormSubmit(form, async (data) => {
    setSaved(false);
    const { data: updated } = await mutateAsync({ data });
    // Stay on the page: the new values become the form's baseline, and the
    // server-rendered header elsewhere picks them up on refresh.
    reset({
      firstName: updated.firstName ?? "",
      lastName: updated.lastName ?? "",
      phoneNumber: updated.phoneNumber ?? "",
    });
    setSaved(true);
    router.refresh();
  });

  return (
    <ProfileCard
      id="details-heading"
      title="Personopplysninger"
      description="Navnet ditt vises for organisasjonene du er med i. Telefonnummeret brukes bare av Frikanalen når vi må nå deg."
    >
      <Form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <FormError error={error} />
        <div>
          <p className="text-sm font-medium">E-post</p>
          <p className="mt-1 break-words">{user.email}</p>
          <p className="text-foreground/60 mt-0.5 text-xs">
            E-postadressen er brukernavnet ditt. Ta kontakt med oss om den må endres.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AuthField
            id="firstName"
            {...register("firstName")}
            autoComplete={"given-name"}
            label={"Fornavn"}
          />
          <AuthField
            id="lastName"
            {...register("lastName")}
            autoComplete={"family-name"}
            label={"Etternavn"}
          />
        </div>
        <AuthField
          id="phoneNumber"
          {...register("phoneNumber")}
          type={"tel"}
          autoComplete={"tel"}
          label={"Telefonnummer"}
        />
        <div className="flex items-center justify-end gap-3">
          {saved && !formState.isDirty && (
            <p role="status" className="text-success-700 inline-flex items-center gap-1 text-sm">
              <GoCheck aria-hidden="true" />
              Lagret
            </p>
          )}
          <Button type={"submit"} isPending={isSubmitting} isDisabled={!formState.isDirty}>
            Lagre endringer
          </Button>
        </div>
      </Form>
    </ProfileCard>
  );
};
