"use client";
import { Button, Chip, Form, Modal } from "@heroui/react";
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
 * the person scan it from this screen. A link made to hand over shows its
 * QR code at once; one that went by e-mail keeps it behind a button.
 */
export const InvitationLink = ({
  invitation,
  onAnother,
}: {
  invitation: InvitationCreated;
  onAnother?: () => void;
}) => {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(!invitation.email);
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
    <div className="space-y-3" role="status">
      <p>
        <span className="font-medium">
          {invitation.email
            ? `Invitasjonen er sendt til ${invitation.email}.`
            : "Invitasjonen er klar."}
        </span>{" "}
        <span className="text-default-700">
          Lenken virker én gang, til {dateFormat.format(new Date(invitation.expiresAt))}.
        </span>
      </p>
      <div className="flex flex-col gap-4">
        {showQr ? (
          // eslint-disable-next-line @next/next/no-img-element -- a data URI from the API
          <img
            src={invitation.qrCode}
            alt="QR-kode med invitasjonslenken"
            className="size-48 self-center border border-default-200 bg-white p-2"
          />
        ) : null}
        <div className="min-w-0 grow space-y-2">
          <div className="flex gap-2">
            <input
              readOnly
              aria-label="Invitasjonslenke"
              value={invitation.link}
              onFocus={(event) => event.currentTarget.select()}
              className="min-w-0 grow border border-default-300 bg-background px-3 py-2 font-mono text-sm"
            />
            <Button variant="primary" onPress={() => void copy()}>
              {copied ? "Kopiert" : "Kopier"}
            </Button>
          </div>
          <p className="text-sm text-default-600">
            Lenken vises bare nå. Mister dere den, lager dere en ny og trekker tilbake den gamle.
          </p>
          <div className="flex flex-wrap gap-2">
            {invitation.email ? (
              <Button size="sm" variant="tertiary" onPress={() => setShowQr((shown) => !shown)}>
                {showQr ? "Skjul QR-kode" : "Vis QR-kode"}
              </Button>
            ) : null}
            {onAnother ? (
              <Button size="sm" variant="tertiary" onPress={onAnother}>
                {invitation.email ? "Inviter en til" : "Lag en ny lenke"}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

type Way = "email" | "link";

const WAYS: { value: Way; label: string; hint: string }[] = [
  {
    value: "email",
    label: "På e-post",
    hint: "Vi sender lenken til adressen. Har personen ikke bruker, lager de den fra lenken.",
  },
  {
    value: "link",
    label: "Lenke og QR-kode",
    hint: "Send lenken i en melding selv, eller la personen skanne QR-koden fra skjermen deres.",
  },
];

/**
 * Invite someone: by e-mail, or as a link or QR code to hand over. The
 * answer is the same whether or not an address has an account, and an
 * invitation shows by its address (or as a link) until it is accepted, so
 * this tells the editor nothing about who is registered.
 */
export const InviteMemberModal = ({
  organizationId,
  isOpen,
  onClose,
  onInvited,
}: {
  organizationId: number;
  isOpen: boolean;
  onClose: () => void;
  onInvited: () => Promise<unknown>;
}) => {
  const form = useForm<InviteRequest>({ defaultValues: { email: "" } });
  const { mutateAsync: create } = useOrganizationInvitationsCreate();
  const [way, setWay] = useState<Way>("email");
  const [created, setCreated] = useState<InvitationCreated | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [making, setMaking] = useState(false);

  const invite = async (email: string) => {
    const { data: invitation } = await create({ id: organizationId, data: email ? { email } : {} });
    form.reset({ email: "" });
    setCreated(invitation);
    await onInvited();
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

  const choose = (next: Way) => {
    setWay(next);
    setCreated(null);
    setError(null);
  };
  const hint = WAYS.find((w) => w.value === way)?.hint;
  const close = () => {
    choose("email");
    form.reset({ email: "" });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => (open ? undefined : close())}>
      <Modal.Backdrop>
        <Modal.Container size="md">
          <Modal.Dialog>
            <Modal.CloseTrigger aria-label="Lukk" />
            <Modal.Header>
              <Modal.Heading>Inviter et medlem</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="space-y-4">
              <div
                role="group"
                aria-label="Hvordan dere inviterer"
                className="grid grid-cols-2 border border-default-300 bg-background p-0.5 text-sm"
              >
                {WAYS.map((w) => (
                  <button
                    key={w.value}
                    type="button"
                    aria-pressed={way === w.value}
                    onClick={() => choose(w.value)}
                    className={
                      way === w.value
                        ? "bg-foreground px-3 py-1.5 font-medium text-background"
                        : "px-3 py-1.5 text-default-700 hover:bg-default-100"
                    }
                  >
                    {w.label}
                  </button>
                ))}
              </div>
              {created ? (
                <InvitationLink
                  key={created.id}
                  invitation={created}
                  onAnother={() => setCreated(null)}
                />
              ) : (
                <>
                  <p className="text-sm text-default-600">{hint}</p>
                  <FormError error={error ?? inviteError} />
                  {way === "email" ? (
                    <Form onSubmit={onSubmit} className="space-y-3" aria-label="Inviter på e-post">
                      <FormInput
                        label="E-postadresse"
                        labelPlacement="outside-top"
                        type="email"
                        id="member-email"
                        autoFocus
                        {...form.register("email", { required: true })}
                      />
                      <Button type="submit" variant="primary" isPending={isSubmitting}>
                        Send invitasjon
                      </Button>
                    </Form>
                  ) : (
                    <Button variant="primary" isPending={making} onPress={() => void makeLink()}>
                      Lag lenke
                    </Button>
                  )}
                </>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="tertiary" onPress={close}>
                {created ? "Ferdig" : "Avbryt"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
};

/** Invitations not answered yet, as muted rows under the members. */
const PendingInvitations = ({
  organizationId,
  onError,
}: {
  organizationId: number;
  onError: (_message: string | null) => void;
}) => {
  const queryClient = useQueryClient();
  const { mutateAsync: withdraw } = useOrganizationInvitationsDestroy();
  const { data: response } = useOrganizationInvitationsList(organizationId);
  const invitations = response?.data ?? [];

  const onWithdraw = async (invitation: Invitation) => {
    if (!globalThis.confirm(withdrawQuestion(invitation))) return;
    onError(null);
    try {
      await withdraw({ id: organizationId, invitationId: invitation.id });
      await queryClient.invalidateQueries({
        queryKey: getOrganizationInvitationsListQueryKey(organizationId),
      });
    } catch (cause) {
      onError(formatApiError(cause));
    }
  };

  return invitations.map((invitation) => (
    <li
      key={`invitation-${invitation.id}`}
      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3"
    >
      <div className="min-w-0">
        <p className="break-all text-default-700">{invitation.email || "Invitasjonslenke"}</p>
        <p className="text-sm text-default-600">
          Virker til {dateFormat.format(new Date(invitation.expiresAt))}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Chip size="sm" variant="soft">
          Venter på svar
        </Chip>
        <Button size="sm" variant="tertiary" onPress={() => void onWithdraw(invitation)}>
          Trekk tilbake
        </Button>
      </div>
    </li>
  ));
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
  const [inviting, setInviting] = useState(false);

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
        <div className="flex items-center justify-between gap-4">
          <h2 id="members-heading" className="text-lg font-bold">
            Medlemmer
          </h2>
          {mayManage ? (
            <Button size="sm" variant="primary" onPress={() => setInviting(true)}>
              Inviter medlem
            </Button>
          ) : null}
        </div>
        <p className="mt-1 max-w-3xl text-sm text-default-600">
          Medlemmene jobber på vegne av organisasjonen: de laster opp videoer, og når Frikanalen har
          bekreftet hvem de er, setter de opp sendetid.
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
          {mayManage ? (
            <PendingInvitations organizationId={organizationId} onError={setError} />
          ) : null}
        </ul>
      ) : null}
      {mayManage ? (
        <InviteMemberModal
          organizationId={organizationId}
          isOpen={inviting}
          onClose={() => setInviting(false)}
          onInvited={() =>
            queryClient.invalidateQueries({
              queryKey: getOrganizationInvitationsListQueryKey(organizationId),
            })
          }
        />
      ) : null}
    </section>
  );
};
