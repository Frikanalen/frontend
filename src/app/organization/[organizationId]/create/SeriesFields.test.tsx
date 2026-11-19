import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ReactElement, ReactNode } from "react";
import { useForm } from "react-hook-form";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Series } from "@/generated/frikanalenDjangoAPI.schemas";
import { nextEpisodeNumber, SeriesFields } from "./SeriesFields";
import type { SeriesOption } from "./SeriesFields";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  onPress?: () => void;
};

vi.mock("@heroui/react", () => {
  const MockLabel = ({ children }: { children: ReactNode }) => <>{children}</>;
  const MockPopover = ({ children }: { children: ReactNode }) => <>{children}</>;
  const MockListBox = Object.assign(({ children }: { children: ReactNode }) => <>{children}</>, {
    Item: ({ id, children }: { id: string; children: ReactNode }) => (
      <option value={id}>{children}</option>
    ),
    ItemIndicator: () => null,
  });
  const MockSelect = Object.assign(
    ({ children, value, onChange, onBlur }: {
      children: ReactNode;
      value: string;
      onChange: (_key: string) => void;
      onBlur: () => void;
    }) => {
      const childArray = (Array.isArray(children) ? children : [children]) as ReactElement<{
        children: ReactNode;
      }>[];
      const label = childArray.find((child) => child.type === MockLabel);
      const popover = childArray.find((child) => child.type === MockPopover);
      const labelText = String(label?.props.children ?? "");
      return (
        <label>
          {labelText}
          <select
            aria-label={labelText}
            value={value}
            onBlur={onBlur}
            onChange={(event) => onChange(event.target.value)}
          >
            {popover?.props.children}
          </select>
        </label>
      );
    },
    {
      Trigger: () => null,
      Value: () => null,
      Indicator: () => null,
      Popover: MockPopover,
    },
  );

  return {
    Button: ({ children, onPress, ...props }: ButtonProps) => (
      <button onClick={onPress} {...props}>
        {children}
      </button>
    ),
    Label: MockLabel,
    ListBox: MockListBox,
    Select: MockSelect,
  };
});

type Values = {
  seriesId: number | null;
};

const availableSeries = [
  { id: 7, name: "Havna vår", synopsis: "", imageUrl: "", episodeCount: 3 },
  { id: 8, name: "Kveldssending", synopsis: "", imageUrl: "", episodeCount: 6 },
] as Series[];

const Harness = ({
  onSubmit,
  onSeriesChange,
  onCreateSeries,
}: {
  onSubmit: (_values: Values) => void;
  onSeriesChange?: (_series: SeriesOption | null) => void;
  onCreateSeries?: () => void;
}) => {
  const form = useForm<Values>({
    defaultValues: { seriesId: null },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <SeriesFields
        control={form.control}
        series={availableSeries}
        seriesName="seriesId"
        onSeriesChange={onSeriesChange}
        onCreateSeries={onCreateSeries}
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

  it("offers the organization's series and makes its optional state clear", () => {
    render(<Harness onSubmit={vi.fn()} />);

    expect(screen.getByRole("option", { name: "Ingen serie" })).toBeDefined();
    expect(screen.getByRole("option", { name: "Havna vår" })).toBeDefined();
    expect(screen.getByRole("option", { name: "Kveldssending" })).toBeDefined();
    expect(screen.getByText("La stå som «Ingen serie» for en enkeltstående video.")).toBeDefined();
    expect(screen.queryByLabelText("Episodenummer")).toBeNull();
  });

  it("submits the selected series as a numeric id", async () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Serie (valgfritt)"), { target: { value: "7" } });
    fireEvent.click(screen.getByRole("button", { name: "Lagre" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ seriesId: 7 }, expect.anything()));
  });

  it("returns to the standalone-video choice", async () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);

    const series = screen.getByLabelText("Serie (valgfritt)");
    fireEvent.change(series, { target: { value: "7" } });
    fireEvent.change(series, { target: { value: "none" } });

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

  it("offers series creation when requested by the parent form", () => {
    const onCreateSeries = vi.fn();
    render(<Harness onSubmit={vi.fn()} onCreateSeries={onCreateSeries} />);

    expect(screen.queryByLabelText("Episodenummer")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Opprett ny serie" }));
    expect(onCreateSeries).toHaveBeenCalledOnce();
  });
});
