"use client";
import { Button, Chip, Form } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FormInput } from "@/components/FormField";
import { FormError } from "@/components/form/FormError";
import type {
  Invitation,
  InvitationCreated,
  InviteRequest,
  OrganizationMember,
} from "@/generated/frikanalenDjangoAPI.schemas";
import {
  getOrganizationInvitationsListQueryKey,
  getOrganizationMembersListQueryKey,
  useOrganizationInvitationsCreate,
  useOrganizationInvitationsDestroy,
  useOrganizationInvitationsList,
  useOrganizationMembersDestroy,
  useOrganizationMembersList,
} from "@/generated/organization/organization";
import { formatApiError } from "@/lib/formatApiError";
import { useApiFormSubmit } from "@/lib/useApiFormSubmit";

export const removeQuestion = (member: OrganizationMember) =>
  `Fjerne ${member.name || member.email} fra organisasjonen? De mister tilgangen til Studio.`;

export const LEAVE_QUESTION =
  "Forlate organisasjonen? Du mister tilgangen til Studio, og redaktøren må invitere deg på nytt.";

export const withdrawQuestion = (invitation: Invitation) =>
  invitation.email
    ? `Trekke tilbake invitasjonen til ${invitation.email}? Lenken i e-posten slutter å virke.`
    : "Trekke tilbake invitasjonslenken? Den slutter å virke.";

const dateFormat = new Intl.DateTimeFormat("nb-NO", {
  day: "numeric",
  month: "long",
  timeZone: "Europe/Oslo",
});

/**
 * A new invitation's link, the only time it can be shown: copy it, or let
 * the person scan it from this screen.
 */
export const InvitationLink = ({ invitation }: { invitation: InvitationCreated }) => {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(invitation.link);
      setCopied(true);
    } catch {
      // No clipboard (an insecure page, or a refusal): the field is
      // selectable, so it can still be copied by hand.
      setCopied(false);
    }
  };

  return (
    <div className="space-y-3 border border-default-200 bg-default-50 p-4" role="status">
      <p className="font-medium">
        {invitation.email
          ? `Invitasjonen er sendt til ${invitation.email}.`
          : "Invitasjonen er klar."}{" "}
        <span className="font-normal text-default-700">
          Dere kan også dele lenken selv. Den virker én gang, til{" "}
          {dateFormat.format(new Date(invitation.expiresAt))}.
        </span>
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          readOnly
          aria-label="Invitasjonslenke"
          value={invitation.link}
          onFocus={(event) => event.currentTarget.select()}
          className="min-w-0 grow border border-default-300 bg-background px-3 py-2 font-mono text-sm"
        />
        <div className="flex gap-2">
          <Button variant="secondary" onPress={() => void copy()}>
            {copied ? "Kopiert" : "Kopier"}
          </Button>
          <Button variant="tertiary" onPress={() => setShowQr((shown) => !shown)}>
            {showQr ? "Skjul QR-kode" : "Vis QR-kode"}
          </Button>
        </div>
      </div>
      {showQr ? (
        // eslint-disable-next-line @next/next/no-img-element -- a data URI from the API
        <img
          src={invitation.qrCode}
          alt="QR-kode med invitasjonslenken"
          className="size-56 bg-white p-2"
        />
      ) : null}
      <p className="text-sm text-default-600">
        Lenken vises bare nå. Mister dere den, lager dere en ny og trekker tilbake den gamle.
      </p>
    </div>
  );
};

/**
 * Invite someone: by e-mail, or as a link or QR code to hand over. The
 * answer is the same whether or not an address has an account, and an
 * invitation shows by its address (or as a link) until it is accepted, so
 * this tells the editor nothing about who is registered.
 */
const Invitations = ({ organizationId }: { organizationId: number }) => {
  const queryClient = useQueryClient();
  const form = useForm<InviteRequest>({ defaultValues: { email: "" } });
  const { mutateAsync: create } = useOrganizationInvitationsCreate();
  const { mutateAsync: withdraw } = useOrganizationInvitationsDestroy();
  const { data: response } = useOrganizationInvitationsList(organizationId);
  const invitations = response?.data ?? [];
  const [created, setCreated] = useState<InvitationCreated | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [making, setMaking] = useState(false);
  const refresh = () =>
    queryClient.invalidateQueries({
      queryKey: getOrganizationInvitationsListQueryKey(organizationId),
    });

  const invite = async (email: string) => {
    setCreated(null);
    const { data: invitation } = await create({ id: organizationId, data: email ? { email } : {} });
    form.reset({ email: "" });
    setCreated(invitation);
    await refresh();
  };

  const {
    onSubmit,
    error: inviteError,
    isSubmitting,
  } = useApiFormSubmit(form, (data) => invite(data.email ?? ""));

  const makeLink = async () => {
    setError(null);
    setMaking(true);
    try {
      await invite("");
    } catch (cause) {
      setError(formatApiError(cause));
    } finally {
      setMaking(false);
    }
  };

  const onWithdraw = async (invitation: Invitation) => {
    if (!globalThis.confirm(withdrawQuestion(invitation))) return;
    setError(null);
    try {
      await withdraw({ id: organizationId, invitationId: invitation.id });
      if (created?.id === invitation.id) setCreated(null);
      await refresh();
    } catch (cause) {
      setError(formatApiError(cause));
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold">Inviter et medlem</h3>
        <p className="mt-1 text-sm text-default-600">
          Send invitasjonen på e-post, eller lag en lenke dere deler selv, som tekst eller QR-kode.
          Har personen ikke bruker på Frikanalen, lager de den fra lenken.
        </p>
      </div>
      <FormError error={error ?? inviteError} />
      <Form onSubmit={onSubmit} className="block" aria-label="Inviter på e-post">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <FormInput
            label="E-postadresse"
            labelPlacement="outside-top"
            type="email"
            id="member-email"
            className="w-full sm:max-w-sm"
            isRequired
            {...form.register("email", { required: true })}
          />
          <div className="flex items-center gap-2">
            <Button type="submit" variant="secondary" isPending={isSubmitting}>
              Send på e-post
            </Button>
            <span className="text-sm text-default-600">eller</span>
            <Button variant="tertiary" isPending={making} onPress={() => void makeLink()}>
              Lag lenke
            </Button>
          </div>
        </div>
      </Form>
      {created ? <InvitationLink invitation={created} /> : null}
      {invitations.length > 0 ? (
        <div>
          <h3 className="text-sm font-semibold">Invitert, ikke svart ennå</h3>
          <ul className="mt-1 divide-y divide-default-200 border-y border-default-200">
            {invitations.map((invitation) => (
              <li
                key={invitation.id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3"
              >
                <div className="min-w-0">
                  <p className="break-all">{invitation.email || "Lenke"}</p>
                  <p className="text-sm text-default-600">
                    Virker til {dateFormat.format(new Date(invitation.expiresAt))}
                  </p>
                </div>
                <Button size="sm" variant="tertiary" onPress={() => void onWithdraw(invitation)}>
                  Trekk tilbake
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
};

/**
 * Who works for the organization. Members act on its behalf: they upload
 * videos and, once Frikanalen has confirmed who they are, set up airtime.
 * The editor invites and removes members; a member can leave on their own.
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
          {mayManage ? " Dere inviterer nye medlemmer på e-post eller med en lenke." : null}
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
      {mayManage ? <Invitations organizationId={organizationId} /> : null}
    </section>
  );
};
