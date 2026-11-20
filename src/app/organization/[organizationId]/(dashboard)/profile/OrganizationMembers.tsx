"use client";
import { Button, Chip, Form } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FormInput } from "@/components/FormField";
import { FormError } from "@/components/form/FormError";
import type { AddMemberRequest, OrganizationMember } from "@/generated/frikanalenDjangoAPI.schemas";
import {
  getOrganizationMembersListQueryKey,
  useOrganizationMembersCreate,
  useOrganizationMembersDestroy,
  useOrganizationMembersList,
} from "@/generated/organization/organization";
import { formatApiError } from "@/lib/formatApiError";
import { useApiFormSubmit } from "@/lib/useApiFormSubmit";

export const removeQuestion = (member: OrganizationMember) =>
  `Fjerne ${member.name || member.email} fra organisasjonen? De mister tilgangen til Studio.`;

export const LEAVE_QUESTION =
  "Forlate organisasjonen? Du mister tilgangen til Studio, og redaktøren må legge deg til igjen.";

const AddMember = ({ organizationId }: { organizationId: number }) => {
  const queryClient = useQueryClient();
  const form = useForm<AddMemberRequest>({ defaultValues: { email: "" } });
  const { mutateAsync } = useOrganizationMembersCreate();
  const [added, setAdded] = useState<string | null>(null);
  const { onSubmit, error, isSubmitting } = useApiFormSubmit(form, async (data) => {
    setAdded(null);
    const { data: member } = await mutateAsync({ id: organizationId, data });
    form.reset({ email: "" });
    setAdded(member.name || member.email);
    await queryClient.invalidateQueries({
      queryKey: getOrganizationMembersListQueryKey(organizationId),
    });
  });

  return (
    <Form onSubmit={onSubmit} className="block space-y-2" aria-label="Legg til medlem">
      <FormError error={error} />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <FormInput
          label="Legg til medlem"
          labelPlacement="outside-top"
          type="email"
          id="member-email"
          className="w-full sm:max-w-sm"
          description="E-postadressen personen bruker for å logge inn på Frikanalen."
          isRequired
          {...form.register("email", { required: true })}
        />
        <Button type="submit" variant="secondary" isPending={isSubmitting}>
          Legg til
        </Button>
      </div>
      {added ? (
        <p role="status" className="text-sm text-success">
          {added} er lagt til og har fått beskjed på e-post.
        </p>
      ) : null}
    </Form>
  );
};

/**
 * Who works for the organization. Members act on its behalf: they upload
 * videos and, once Frikanalen has confirmed who they are, set up airtime.
 * The editor decides who the members are; a member can leave on their own.
 */
export const OrganizationMembers = ({
  organizationId,
  currentUserId,
  mayManage,
}: {
  organizationId: number;
  currentUserId: number;
  mayManage: boolean;
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    data: response,
    isLoading,
    error: loadError,
  } = useOrganizationMembersList(organizationId);
  const people = response?.data;
  const { mutateAsync: remove } = useOrganizationMembersDestroy();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  const onRemove = async (member: OrganizationMember) => {
    const leaving = member.id === currentUserId;
    if (!globalThis.confirm(leaving ? LEAVE_QUESTION : removeQuestion(member))) return;
    setError(null);
    setBusy(member.id);
    try {
      await remove({ id: organizationId, userId: member.id });
      if (leaving) {
        router.push("/profile");
        router.refresh();
        return;
      }
      await queryClient.invalidateQueries({
        queryKey: getOrganizationMembersListQueryKey(organizationId),
      });
    } catch (cause) {
      setError(formatApiError(cause));
    } finally {
      setBusy(null);
    }
  };

  return (
    <section
      aria-labelledby="members-heading"
      className="mt-8 max-w-3xl space-y-4 border-t border-default-200 pt-5"
    >
      <div>
        <h2 id="members-heading" className="text-lg font-bold">
          Medlemmer
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-default-600">
          Medlemmene jobber på vegne av organisasjonen: de laster opp videoer, og når Frikanalen har
          bekreftet hvem de er, setter de opp sendetid.
          {mayManage ? " Dere legger til folk som allerede har en bruker på Frikanalen." : null}
        </p>
      </div>
      <FormError error={error ?? (loadError ? formatApiError(loadError) : null)} />
      {isLoading ? <p className="text-default-600">Henter medlemmene …</p> : null}
      {people ? (
        <ul className="divide-y divide-default-200 border-y border-default-200">
          {people.map((person) => {
            const isMe = person.id === currentUserId;
            const canRemove = !person.isEditor && (mayManage || isMe);
            return (
              <li
                key={person.id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3"
              >
                <div className="min-w-0">
                  <p className="font-medium break-words">
                    {person.name || person.email}
                    {isMe ? <span className="font-normal text-default-600"> (deg)</span> : null}
                  </p>
                  {person.name ? (
                    <p className="text-sm break-all text-default-600">{person.email}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {person.isEditor ? <Chip size="sm">Redaktør</Chip> : null}
                  {person.identityConfirmed ? null : (
                    <Chip size="sm" color="warning" variant="soft">
                      Identitet ikke bekreftet
                    </Chip>
                  )}
                  {canRemove ? (
                    <Button
                      size="sm"
                      variant={isMe ? "secondary" : "danger-soft"}
                      isPending={busy === person.id}
                      onPress={() => void onRemove(person)}
                    >
                      {isMe ? "Forlat organisasjonen" : "Fjern"}
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
      {mayManage ? <AddMember organizationId={organizationId} /> : null}
    </section>
  );
};
