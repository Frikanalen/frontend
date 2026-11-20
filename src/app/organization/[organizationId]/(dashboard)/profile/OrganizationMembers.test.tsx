import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { FormHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Invitation, OrganizationMember } from "@/generated/frikanalenDjangoAPI.schemas";
import {
  LEAVE_QUESTION,
  OrganizationMembers,
  removeQuestion,
  withdrawQuestion,
} from "./OrganizationMembers";

const api = vi.hoisted(() => ({
  people: [] as unknown[],
  invitations: [] as unknown[],
  create: vi.fn(),
  withdraw: vi.fn(),
  destroy: vi.fn(),
  invalidate: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("@/generated/organization/organization", () => ({
  getOrganizationMembersListQueryKey: (id: number) => [`/api/organization/${id}/members`],
  useOrganizationMembersList: () => ({ data: { data: api.people }, isLoading: false, error: null }),
  getOrganizationInvitationsListQueryKey: (id: number) => [`/api/organization/${id}/invitations`],
  useOrganizationInvitationsList: () => ({ data: { data: api.invitations } }),
  useOrganizationInvitationsCreate: () => ({ mutateAsync: api.create }),
  useOrganizationInvitationsDestroy: () => ({ mutateAsync: api.withdraw }),
  useOrganizationMembersDestroy: () => ({ mutateAsync: api.destroy }),
}));
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: api.invalidate }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: api.push, refresh: api.refresh }),
}));
vi.mock("@/components/FormField", () => ({
  FormInput: ({ label, ...props }: { label: string } & InputHTMLAttributes<HTMLInputElement>) => (
    <input
      aria-label={label}
      name={props.name}
      onChange={props.onChange}
      onBlur={props.onBlur}
      ref={(props as { ref?: React.Ref<HTMLInputElement> }).ref}
      type={props.type}
    />
  ),
}));
vi.mock("@heroui/react", () => ({
  Form: ({ children, ...props }: FormHTMLAttributes<HTMLFormElement>) => (
    <form {...props}>{children}</form>
  ),
  Chip: ({ children }: { children: ReactNode }) => <span>{children}</span>,
  Button: ({
    children,
    isPending,
    onPress,
    type,
  }: {
    children: ReactNode;
    isPending?: boolean;
    onPress?: () => void;
    type?: "submit";
  }) => (
    <button disabled={isPending} onClick={onPress} type={type ?? "button"}>
      {children}
    </button>
  ),
}));

const editor: OrganizationMember = {
  id: 42,
  name: "Ada Lovelace",
  email: "ada@example.test",
  isEditor: true,
  identityConfirmed: true,
};
const invitation: Invitation = {
  id: 5,
  email: "bo@example.test",
  createdAt: "2026-11-20T12:00:00Z",
  expiresAt: "2026-12-04T12:00:00Z",
};
const member: OrganizationMember = {
  id: 7,
  name: "Bo Berg",
  email: "bo@example.test",
  isEditor: false,
  identityConfirmed: false,
};

const confirm = vi.fn(() => true);
Object.defineProperty(globalThis, "confirm", { configurable: true, value: confirm });

afterEach(() => {
  cleanup();
  confirm.mockClear();
  api.invitations = [];
  for (const fn of [api.create, api.withdraw, api.destroy, api.invalidate, api.push, api.refresh])
    fn.mockReset();
});

describe("OrganizationMembers", () => {
  it("shows the editor and members, and who is not confirmed yet", () => {
    api.people = [editor, member];
    render(<OrganizationMembers organizationId={3} currentUserId={7} mayManage={false} />);
    expect(screen.getByText("Redaktør")).toBeTruthy();
    expect(screen.getByText("Identitet ikke bekreftet")).toBeTruthy();
    // A member does not add or remove others, but can leave.
    expect(screen.queryByLabelText("Legg til medlem")).toBeNull();
    expect(screen.queryByRole("button", { name: "Fjern" })).toBeNull();
    expect(screen.getByRole("button", { name: "Forlat organisasjonen" })).toBeTruthy();
  });

  it("lets the editor invite by e-mail, without saying whether the address has an account", async () => {
    api.people = [editor];
    api.create.mockResolvedValue({ data: invitation });
    render(<OrganizationMembers organizationId={3} currentUserId={42} mayManage />);
    fireEvent.change(screen.getByRole("textbox", { name: "Inviter et medlem" }), {
      target: { value: "bo@example.test" },
    });
    fireEvent.submit(screen.getByRole("form", { name: "Inviter et medlem" }));
    await waitFor(() =>
      expect(api.create).toHaveBeenCalledWith({ id: 3, data: { email: "bo@example.test" } }),
    );
    expect(await screen.findByRole("status")).toHaveProperty(
      "textContent",
      "Invitasjonen er sendt til bo@example.test.",
    );
    expect(api.invalidate).toHaveBeenCalled();
  });

  it("lists open invitations by address and lets the editor withdraw one", async () => {
    api.people = [editor];
    api.invitations = [invitation];
    render(<OrganizationMembers organizationId={3} currentUserId={42} mayManage />);
    expect(screen.getByText("bo@example.test")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Trekk tilbake" }));
    expect(confirm).toHaveBeenCalledWith(withdrawQuestion(invitation));
    await waitFor(() => expect(api.withdraw).toHaveBeenCalledWith({ id: 3, invitationId: 5 }));
  });

  it("lets the editor remove a member, but not themselves", async () => {
    api.people = [editor, member];
    render(<OrganizationMembers organizationId={3} currentUserId={42} mayManage />);
    expect(screen.queryByRole("button", { name: "Forlat organisasjonen" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Fjern" }));
    expect(confirm).toHaveBeenCalledWith(removeQuestion(member));
    await waitFor(() => expect(api.destroy).toHaveBeenCalledWith({ id: 3, userId: 7 }));
    expect(api.push).not.toHaveBeenCalled();
  });

  it("sends a member who leaves to their own profile", async () => {
    api.people = [editor, member];
    render(<OrganizationMembers organizationId={3} currentUserId={7} mayManage={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Forlat organisasjonen" }));
    expect(confirm).toHaveBeenCalledWith(LEAVE_QUESTION);
    await waitFor(() => expect(api.push).toHaveBeenCalledWith("/profile"));
  });
});
