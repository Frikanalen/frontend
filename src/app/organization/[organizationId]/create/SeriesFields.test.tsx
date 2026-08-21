import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Series } from "@/generated/frikanalenDjangoAPI.schemas";
import { SeriesFields } from "./SeriesFields";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  isDisabled?: boolean;
  label: string;
  labelPlacement?: string;
};

type SelectProps = {
  children: (_item: { id: string; name: string }) => ReactNode;
  items: { id: string; name: string }[];
  label: string;
  onBlur: () => void;
  onSelectionChange: (_keys: Set<string>) => void;
  selectedKeys: Set<string>;
};

vi.mock("@heroui/react", () => ({
  Input: ({ isDisabled, label, labelPlacement, ...props }: InputProps) => {
    void labelPlacement;
    return (
      <label>
        {label}
        <input aria-label={label} disabled={isDisabled} {...props} />
      </label>
    );
  },
  Select: ({ children, items, label, onBlur, onSelectionChange, selectedKeys }: SelectProps) => (
    <label>
      {label}
      <select
        aria-label={label}
        value={Array.from(selectedKeys)[0]}
        onBlur={onBlur}
        onChange={(event) => onSelectionChange(new Set([event.target.value]))}
      >
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {children(item)}
          </option>
        ))}
      </select>
    </label>
  ),
  SelectItem: ({ children }: { children: ReactNode }) => children,
}));

type Values = {
  seriesId: number | null;
  episodeNumber: number | null;
};

const availableSeries = [
  { id: 7, name: "Havna vår", synopsis: "", imageUrl: "" },
  { id: 8, name: "Kveldssending", synopsis: "", imageUrl: "" },
] as Series[];

const Harness = ({ onSubmit }: { onSubmit: (_values: Values) => void }) => {
  const form = useForm<Values>({
    defaultValues: { seriesId: null, episodeNumber: null },
  });
  const selectedSeries = useWatch({ control: form.control, name: "seriesId" });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <SeriesFields
        control={form.control}
        register={form.register}
        series={availableSeries}
        seriesName="seriesId"
        episodeName="episodeNumber"
        selectedSeries={selectedSeries}
      />
      <button type="submit">Lagre</button>
    </form>
  );
};

afterEach(cleanup);

describe("SeriesFields", () => {
  it("offers the organization's series and keeps episode numbering disabled without one", () => {
    render(<Harness onSubmit={vi.fn()} />);

    expect(screen.getByRole("option", { name: "Ingen serie" })).toBeDefined();
    expect(screen.getByRole("option", { name: "Havna vår" })).toBeDefined();
    expect(screen.getByRole("option", { name: "Kveldssending" })).toBeDefined();
    expect((screen.getByLabelText("Episodenummer") as HTMLInputElement).disabled).toBe(true);
  });

  it("enables numbering after selection and submits numeric values", async () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Serie"), { target: { value: "7" } });
    const episodeNumber = screen.getByLabelText("Episodenummer");
    expect((episodeNumber as HTMLInputElement).disabled).toBe(false);

    fireEvent.change(episodeNumber, { target: { value: "4" } });
    fireEvent.click(screen.getByRole("button", { name: "Lagre" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ seriesId: 7, episodeNumber: 4 }, expect.anything()),
    );
  });

  it("returns to the seasonless choice and disables numbering again", async () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);

    const series = screen.getByLabelText("Serie");
    fireEvent.change(series, { target: { value: "7" } });
    fireEvent.change(series, { target: { value: "none" } });

    expect((screen.getByLabelText("Episodenummer") as HTMLInputElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Lagre" }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ seriesId: null }, expect.anything()),
    );
  });
});
