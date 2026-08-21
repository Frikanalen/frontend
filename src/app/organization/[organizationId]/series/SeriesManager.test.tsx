import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ElementType, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Series } from "@/generated/frikanalenDjangoAPI.schemas";
import { SeriesManager } from "./SeriesManager";

const api = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  refetch: vi.fn(),
  results: [] as Series[],
  isError: false,
}));

vi.mock("@/generated/series/series", () => ({
  useSeriesList: () => ({
    data: { data: { results: api.results } },
    isError: api.isError,
    refetch: api.refetch,
  }),
  useSeriesCreate: () => ({ mutateAsync: api.create }),
  useSeriesPartialUpdate: () => ({ mutateAsync: api.update }),
}));

type ButtonProps = {
  as?: ElementType;
  children: ReactNode;
  href?: string;
  onPress?: () => void;
  type?: "button" | "submit" | "reset";
};

type FieldProps = {
  label: string;
  labelPlacement?: string;
};

vi.mock("@heroui/react", () => ({
  Button: ({ as: Component, children, href, onPress, type }: ButtonProps) =>
    Component ? (
      <a href={href}>{children}</a>
    ) : (
      <button type={type ?? "button"} onClick={onPress}>
        {children}
      </button>
    ),
  Form: ({ children, ...props }: React.FormHTMLAttributes<HTMLFormElement>) => (
    <form {...props}>{children}</form>
  ),
  Input: ({
    label,
    labelPlacement,
    ...props
  }: FieldProps & InputHTMLAttributes<HTMLInputElement>) => {
    void labelPlacement;
    return (
      <label>
        {label}
        <input aria-label={label} {...props} />
      </label>
    );
  },
  Link: "a",
  Table: ({ children }: { children: ReactNode }) => <table>{children}</table>,
  TableBody: ({ children }: { children: ReactNode }) => <tbody>{children}</tbody>,
  TableCell: ({ children }: { children: ReactNode }) => <td>{children}</td>,
  TableColumn: ({ children }: { children: ReactNode }) => <th>{children}</th>,
  TableHeader: ({ children }: { children: ReactNode }) => (
    <thead>
      <tr>{children}</tr>
    </thead>
  ),
  TableRow: ({ children }: { children: ReactNode }) => <tr>{children}</tr>,
  Textarea: ({
    label,
    labelPlacement,
    ...props
  }: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) => {
    void labelPlacement;
    return (
      <label>
        {label}
        <textarea aria-label={label} {...props} />
      </label>
    );
  },
}));

beforeEach(() => {
  api.create.mockReset().mockResolvedValue({});
  api.update.mockReset().mockResolvedValue({});
  api.refetch.mockReset().mockResolvedValue({});
  api.results = [
    {
      id: 4,
      name: "Havna vår",
      synopsis: "Historier fra kaia.",
      imageUrl: "",
      episodeCount: 3,
    },
  ] as Series[];
  api.isError = false;
});

afterEach(cleanup);

describe("SeriesManager", () => {
  it("lists existing series without exposing a raw artwork address", () => {
    render(<SeriesManager organizationId={9} />);

    expect(screen.getByText("Havna vår")).toBeDefined();
    expect(screen.getByText("3")).toBeDefined();
    expect(screen.getByRole("link", { name: "Offentlig side" }).getAttribute("href")).toBe(
      "/series/4",
    );
    expect(screen.queryByLabelText("Bildeadresse")).toBeNull();
  });

  it("creates a series with only member-editable fields", async () => {
    render(<SeriesManager organizationId={9} />);

    fireEvent.change(screen.getByLabelText("Navn"), { target: { value: "Ny serie" } });
    fireEvent.change(screen.getByLabelText("Beskrivelse"), {
      target: { value: "En kort beskrivelse." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Opprett serie" }));

    await waitFor(() =>
      expect(api.create).toHaveBeenCalledWith({
        data: {
          name: "Ny serie",
          synopsis: "En kort beskrivelse.",
          organization: 9,
        },
      }),
    );
    expect(api.refetch).toHaveBeenCalledOnce();
  });

  it("loads an existing series into the form and updates it", async () => {
    render(<SeriesManager organizationId={9} />);

    fireEvent.click(screen.getByRole("button", { name: "Rediger" }));
    expect((screen.getByLabelText("Navn") as HTMLInputElement).value).toBe("Havna vår");
    expect((screen.getByLabelText("Beskrivelse") as HTMLTextAreaElement).value).toBe(
      "Historier fra kaia.",
    );

    fireEvent.change(screen.getByLabelText("Navn"), { target: { value: "Havna" } });
    fireEvent.click(screen.getByRole("button", { name: "Lagre" }));

    await waitFor(() =>
      expect(api.update).toHaveBeenCalledWith({
        id: "4",
        data: {
          name: "Havna",
          synopsis: "Historier fra kaia.",
          organization: 9,
        },
      }),
    );
    expect(api.refetch).toHaveBeenCalledOnce();
  });

  it("cancels editing and restores an empty create form", () => {
    render(<SeriesManager organizationId={9} />);

    fireEvent.click(screen.getByRole("button", { name: "Rediger" }));
    fireEvent.click(screen.getByRole("button", { name: "Avbryt" }));

    expect(screen.getByRole("heading", { name: "Ny serie" })).toBeDefined();
    expect((screen.getByLabelText("Navn") as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText("Beskrivelse") as HTMLTextAreaElement).value).toBe("");
  });

  it("shows a failed mutation in the form", async () => {
    api.create.mockRejectedValueOnce(new Error("Serien kunne ikke lagres."));
    render(<SeriesManager organizationId={9} />);

    fireEvent.change(screen.getByLabelText("Navn"), { target: { value: "Ny serie" } });
    fireEvent.click(screen.getByRole("button", { name: "Opprett serie" }));

    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toBe("Serien kunne ikke lagres."),
    );
    expect(api.refetch).not.toHaveBeenCalled();
  });

  it("shows list failures instead of an empty table", () => {
    api.isError = true;

    render(<SeriesManager organizationId={9} />);

    expect(screen.getByRole("alert").textContent).toContain("Seriene kunne ikke hentes");
  });
});
