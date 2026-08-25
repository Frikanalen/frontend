import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ElementType, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Series } from "@/generated/frikanalenDjangoAPI.schemas";
import { SeriesManager } from "./SeriesManager";

const api = vi.hoisted(() => ({
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
}));

vi.mock("@/app/organization/[organizationId]/create/NewSeriesModal", () => ({
  NewSeriesModal: ({
    isOpen,
    onCreated,
  }: {
    isOpen: boolean;
    onCreated: (_series: { id: number; name: string; episodeCount: number }) => void;
  }) =>
    isOpen ? (
      <div role="dialog" aria-label="Opprett ny serie">
        <button onClick={() => onCreated({ id: 5, name: "Ny serie", episodeCount: 0 })}>
          Fullfør opprettelse
        </button>
      </div>
    ) : null,
}));

vi.mock("next/link", () => ({ default: "a" }));

type ButtonProps = {
  as?: ElementType;
  children: ReactNode;
  href?: string;
  onPress?: () => void;
};

vi.mock("@heroui/react", () => ({
  Button: ({ as: Component, children, href, onPress }: ButtonProps) =>
    Component ? <a href={href}>{children}</a> : <button onClick={onPress}>{children}</button>,
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
}));

beforeEach(() => {
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
  it("lists series and links editing to the dedicated organization route", () => {
    render(<SeriesManager organizationId={9} />);

    expect(screen.getByText("Havna vår")).toBeDefined();
    expect(screen.getByText("3")).toBeDefined();
    expect(screen.getByRole("link", { name: "Rediger" }).getAttribute("href")).toBe(
      "/organization/9/series/4",
    );
    expect(screen.getByRole("link", { name: "Offentlig side" }).getAttribute("href")).toBe(
      "/series/4",
    );
  });

  it("opens series creation in a modal and refreshes the list afterward", async () => {
    render(<SeriesManager organizationId={9} />);

    expect(screen.queryByRole("dialog", { name: "Opprett ny serie" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Ny serie" }));
    fireEvent.click(screen.getByRole("button", { name: "Fullfør opprettelse" }));

    await waitFor(() => expect(api.refetch).toHaveBeenCalledOnce());
  });

  it("shows list failures instead of an empty table", () => {
    api.isError = true;

    render(<SeriesManager organizationId={9} />);

    expect(screen.getByRole("alert").textContent).toContain("Seriene kunne ikke hentes");
  });
});
