import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type {
  FormHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Organization } from "@/generated/frikanalenDjangoAPI.schemas";
import { OrganizationProfileForm } from "./OrganizationProfileForm";

const api = vi.hoisted(() => ({ update: vi.fn(), refresh: vi.fn() }));

vi.mock("@/generated/organization/organization", () => ({
  useOrganizationPartialUpdate: () => ({ mutateAsync: api.update }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: api.refresh }) }));
vi.mock("@/components/FormField", () => ({
  FormInput: ({ label, ...props }: { label: string } & InputHTMLAttributes<HTMLInputElement>) => (
    <input aria-label={label} {...props} />
  ),
  FormTextArea: ({
    label,
    ...props
  }: { label: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea aria-label={label} {...props} />
  ),
}));
vi.mock("@heroui/react", () => ({
  Form: ({ children, ...props }: FormHTMLAttributes<HTMLFormElement>) => (
    <form {...props}>{children}</form>
  ),
  Button: ({
    children,
    isDisabled,
    isPending,
    ...props
  }: {
    children: ReactNode;
    isDisabled?: boolean;
    isPending?: boolean;
    type?: "submit";
  }) => (
    <button disabled={isDisabled || isPending} {...props}>
      {children}
    </button>
  ),
}));

const organization = {
  id: 3,
  name: "Havneforeningen",
  description: "Om kaia.",
  homepage: "",
  orgnr: "971526920",
  postalAddress: "",
  streetAddress: "",
  editorId: 42,
  editorName: "Ada Lovelace",
  editorEmail: "ada@example.test",
  fkmember: true,
} as unknown as Organization;

afterEach(() => {
  cleanup();
  api.update.mockReset();
});

describe("OrganizationProfileForm", () => {
  it("lets the editor rename the organization", async () => {
    api.update.mockResolvedValue({ data: { ...organization, name: "Havnelaget" } });
    render(<OrganizationProfileForm organization={organization} mayEdit />);

    fireEvent.change(screen.getByLabelText("Navn"), { target: { value: "Havnelaget" } });
    fireEvent.click(screen.getByRole("button", { name: "Lagre" }));

    await waitFor(() =>
      expect(api.update).toHaveBeenCalledWith({
        id: 3,
        data: expect.objectContaining({ name: "Havnelaget", description: "Om kaia." }),
      }),
    );
    expect(await screen.findByRole("status")).toHaveProperty("textContent", "Lagret");
  });

  it("shows members the profile as it stands, and who can change it", () => {
    render(<OrganizationProfileForm organization={organization} mayEdit={false} />);

    expect(screen.getByRole("note").textContent).toContain("Bare redaktøren, Ada Lovelace");
    expect(screen.queryByRole("button", { name: "Lagre" })).toBeNull();
    expect(screen.getByText("Om kaia.")).toBeTruthy();
  });
});
