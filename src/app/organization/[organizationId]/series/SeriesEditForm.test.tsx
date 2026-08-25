import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Series } from "@/generated/frikanalenDjangoAPI.schemas";
import { SeriesEditForm } from "./SeriesEditForm";
import type { SeriesMetadataAction } from "./seriesMetadata";

type FieldProps = { label: string; labelPlacement?: string };

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

describe("SeriesEditForm", () => {
  it("loads and saves the series name and description", async () => {
    const updateAction = vi.fn<SeriesMetadataAction>(async () => ({
      status: "success",
      message: "Serieopplysningene er lagret.",
    }));
    render(<SeriesEditForm series={series} updateAction={updateAction} />);

    expect((screen.getByLabelText("Navn") as HTMLInputElement).value).toBe("Havna vår");
    expect((screen.getByLabelText("Beskrivelse") as HTMLTextAreaElement).value).toBe(
      "Historier fra kaia.",
    );

    fireEvent.change(screen.getByLabelText("Navn"), { target: { value: "Havna" } });
    fireEvent.change(screen.getByLabelText("Beskrivelse"), {
      target: { value: "Nye historier." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lagre" }));

    await waitFor(() => expect(updateAction).toHaveBeenCalledOnce());
    const submitted = updateAction.mock.calls[0][1];
    expect(submitted.get("name")).toBe("Havna");
    expect(submitted.get("synopsis")).toBe("Nye historier.");
    expect((await screen.findByRole("status")).textContent).toBe("Serieopplysningene er lagret.");
  });

  it("shows metadata update failures", async () => {
    const updateAction: SeriesMetadataAction = async () => ({
      status: "error",
      message: "Serien kunne ikke lagres.",
    });
    render(<SeriesEditForm series={series} updateAction={updateAction} />);

    fireEvent.click(screen.getByRole("button", { name: "Lagre" }));

    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toBe("Serien kunne ikke lagres."),
    );
  });
});
