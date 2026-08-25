import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Series } from "@/generated/frikanalenDjangoAPI.schemas";
import { nextEpisodeNumber, SeriesFields } from "./SeriesFields";
import type { SeriesOption } from "./SeriesFields";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  isDisabled?: boolean;
  label: string;
  labelPlacement?: string;
};

type SelectProps = {
  children: (_item: { id: string; name: string }) => ReactNode;
  items: { id: string; name: string }[];
  label: string;
  description?: string;
  onBlur: () => void;
  onSelectionChange: (_keys: Set<string>) => void;
  selectedKeys: Set<string>;
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  onPress?: () => void;
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
  Button: ({ children, onPress, ...props }: ButtonProps) => (
    <button onClick={onPress} {...props}>
      {children}
    </button>
  ),
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
  { id: 7, name: "Havna vår", synopsis: "", imageUrl: "", episodeCount: 3 },
  { id: 8, name: "Kveldssending", synopsis: "", imageUrl: "", episodeCount: 6 },
] as Series[];

const Harness = ({
  onSubmit,
  onSeriesChange,
  onCreateSeries,
  showEpisodeNumber,
}: {
  onSubmit: (_values: Values) => void;
  onSeriesChange?: (_series: SeriesOption | null) => void;
  onCreateSeries?: () => void;
  showEpisodeNumber?: boolean;
}) => {
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
        onSeriesChange={onSeriesChange}
        onCreateSeries={onCreateSeries}
        showEpisodeNumber={showEpisodeNumber}
      />
      <button type="submit">Lagre</button>
    </form>
  );
};

afterEach(cleanup);

describe("SeriesFields", () => {
  it("suggests the number after the series' latest episode", () => {
    expect(nextEpisodeNumber(availableSeries[0])).toBe(4);
    expect(nextEpisodeNumber(null)).toBeNull();
  });

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

    fireEvent.change(screen.getByLabelText("Serie (valgfritt)"), { target: { value: "7" } });
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

    const series = screen.getByLabelText("Serie (valgfritt)");
    fireEvent.change(series, { target: { value: "7" } });
    fireEvent.change(series, { target: { value: "none" } });

    expect((screen.getByLabelText("Episodenummer") as HTMLInputElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Lagre" }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ seriesId: null }, expect.anything()),
    );
  });

  it("reports the selected series so the creation form can suggest the next episode", () => {
    const onSeriesChange = vi.fn();
    render(<Harness onSubmit={vi.fn()} onSeriesChange={onSeriesChange} />);

    fireEvent.change(screen.getByLabelText("Serie (valgfritt)"), { target: { value: "7" } });
    expect(onSeriesChange).toHaveBeenCalledWith(availableSeries[0]);
  });

  it("replaces the episode field with series creation in the video creation form", () => {
    const onCreateSeries = vi.fn();
    render(
      <Harness onSubmit={vi.fn()} onCreateSeries={onCreateSeries} showEpisodeNumber={false} />,
    );

    expect(screen.queryByLabelText("Episodenummer")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Opprett ny serie" }));
    expect(onCreateSeries).toHaveBeenCalledOnce();
  });
});
