import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FormHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Series } from "@/generated/frikanalenDjangoAPI.schemas";
import { SeriesEditForm } from "./SeriesEditForm";

type FieldProps = { label: string; labelPlacement?: string };

const api = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("@/generated/series/series", () => ({
  useSeriesPartialUpdate: () => ({ mutateAsync: api.mutateAsync }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: api.refresh }) }));

vi.mock("@heroui/react", () => ({
  Button: ({
    children,
    isLoading,
    ...props
  }: {
    children: ReactNode;
    isLoading?: boolean;
  } & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button disabled={isLoading} {...props}>
      {children}
    </button>
  ),
  Form: ({ children, ...props }: FormHTMLAttributes<HTMLFormElement>) => (
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

const series = {
  id: 4,
  name: "Havna vår",
  synopsis: "Historier fra kaia.",
  organization: { id: 9, name: "Havneforeningen" },
  episodeCount: 3,
} as Series;

afterEach(cleanup);
beforeEach(() => {
  api.mutateAsync.mockReset().mockResolvedValue({ data: series });
  api.refresh.mockReset();
});

describe("SeriesEditForm", () => {
  it("loads and saves the series name and description", async () => {
    render(<SeriesEditForm series={series} />);

    expect((screen.getByLabelText("Navn") as HTMLInputElement).value).toBe("Havna vår");
    expect((screen.getByLabelText("Beskrivelse") as HTMLTextAreaElement).value).toBe(
      "Historier fra kaia.",
    );

    fireEvent.change(screen.getByLabelText("Navn"), { target: { value: "Havna" } });
    fireEvent.change(screen.getByLabelText("Beskrivelse"), {
      target: { value: "Nye historier." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lagre" }));

    await waitFor(() =>
      expect(api.mutateAsync).toHaveBeenCalledWith({
        id: "4",
        data: { name: "Havna", synopsis: "Nye historier." },
      }),
    );
    expect(api.refresh).toHaveBeenCalledOnce();
    expect((await screen.findByRole("status")).textContent).toBe("Serieopplysningene er lagret.");
  });

  it("shows metadata update failures", async () => {
    api.mutateAsync.mockRejectedValueOnce(new Error("Serien kunne ikke lagres."));
    render(<SeriesEditForm series={series} />);

    fireEvent.click(screen.getByRole("button", { name: "Lagre" }));

    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toBe("Serien kunne ikke lagres."),
    );
    expect(api.refresh).not.toHaveBeenCalled();
  });
});
