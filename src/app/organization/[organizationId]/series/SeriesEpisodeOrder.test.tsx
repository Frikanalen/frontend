import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Video } from "@/generated/frikanalenDjangoAPI.schemas";
import { SeriesEpisodeOrder } from "./SeriesEpisodeOrder";

const api = vi.hoisted(() => ({
  videos: [] as Video[],
  count: 0,
  isPending: false,
  isError: false,
  update: vi.fn(),
  refetch: vi.fn(),
}));

vi.mock("@/generated/videos/videos", () => ({
  useVideosList: () => ({
    data: { data: { results: api.videos, count: api.count } },
    isPending: api.isPending,
    isError: api.isError,
    refetch: api.refetch,
  }),
  useVideosPartialUpdate: () => ({ mutateAsync: api.update }),
}));

vi.mock("./AddSeriesVideosModal", () => ({
  AddSeriesVideosModal: ({
    isDisabled,
    onAdded,
  }: {
    isDisabled: boolean;
    onAdded: (_count: number) => void;
  }) => (
    <button disabled={isDisabled} onClick={() => onAdded(2)}>
      Legg til i serien
    </button>
  ),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@heroui/react", () => ({
  Button: ({
    children,
    onPress,
    isDisabled,
    isLoading,
    ...props
  }: {
    children: ReactNode;
    onPress?: () => void;
    isDisabled?: boolean;
    isLoading?: boolean;
  } & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button disabled={isDisabled || isLoading} onClick={onPress} {...props}>
      {children}
    </button>
  ),
  Spinner: () => <span>spinner</span>,
}));

const video = (id: number, name: string, episodeNumber: number | null): Video =>
  ({ id, name, episodeNumber }) as Video;

beforeEach(() => {
  api.videos = [];
  api.count = 0;
  api.isPending = false;
  api.isError = false;
  api.update.mockReset().mockResolvedValue({});
  api.refetch.mockReset().mockResolvedValue({});
});

afterEach(cleanup);

describe("SeriesEpisodeOrder", () => {
  it("shows episodes in editorial order and previews consecutive numbering", () => {
    api.videos = [video(3, "Uten nummer", null), video(2, "Andre", 5), video(1, "Første", 2)];
    api.count = api.videos.length;

    render(<SeriesEpisodeOrder organizationId={9} seriesId={4} />);

    const rows = screen.getAllByRole("listitem");
    expect(within(rows[0]).getByText("Første")).toBeDefined();
    expect(within(rows[0]).getByLabelText("Episodenummer 1")).toBeDefined();
    expect(within(rows[1]).getByText("Andre")).toBeDefined();
    expect(within(rows[1]).getByLabelText("Episodenummer 2")).toBeDefined();
    expect(within(rows[2]).getByText("Uten nummer")).toBeDefined();
    expect(within(rows[2]).getByText("Ikke nummerert")).toBeDefined();
  });

  it("moves episodes and saves all affected numbers together", async () => {
    api.videos = [video(1, "Første", 1), video(2, "Andre", 2)];
    api.count = api.videos.length;

    render(<SeriesEpisodeOrder organizationId={9} seriesId={4} />);

    expect(
      (screen.getByRole("button", { name: "Lagre rekkefølge" }) as HTMLButtonElement).disabled,
    ).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Flytt Andre opp" }));

    const rows = screen.getAllByRole("listitem");
    expect(within(rows[0]).getByText("Andre")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Lagre rekkefølge" }));

    await waitFor(() => expect(api.update).toHaveBeenCalledTimes(4));
    expect(api.update).toHaveBeenCalledWith({ id: 2, data: { episodeNumber: null } });
    expect(api.update).toHaveBeenCalledWith({ id: 1, data: { episodeNumber: null } });
    expect(api.update).toHaveBeenCalledWith({ id: 2, data: { episodeNumber: 1 } });
    expect(api.update).toHaveBeenCalledWith({ id: 1, data: { episodeNumber: 2 } });
    expect(api.refetch).toHaveBeenCalledOnce();
    expect((await screen.findByRole("status")).textContent).toBe("Episoderekkefølgen er lagret.");
  });

  it("renumbers gaps without requiring a move", async () => {
    api.videos = [video(1, "Første", 2), video(2, "Andre", 5)];
    api.count = api.videos.length;

    render(<SeriesEpisodeOrder organizationId={9} seriesId={4} />);
    fireEvent.click(screen.getByRole("button", { name: "Lagre rekkefølge" }));

    await waitFor(() => expect(api.update).toHaveBeenCalledTimes(4));
    expect(api.update).toHaveBeenCalledWith({ id: 1, data: { episodeNumber: 1 } });
    expect(api.update).toHaveBeenCalledWith({ id: 2, data: { episodeNumber: 2 } });
  });

  it("does not save an incomplete list", () => {
    api.videos = [video(1, "Første", 2)];
    api.count = 1001;

    render(<SeriesEpisodeOrder organizationId={9} seriesId={4} />);

    expect(screen.getByRole("alert").textContent).toContain("flere enn 1000 episoder");
    expect(
      (screen.getByRole("button", { name: "Lagre rekkefølge" }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("shows update failures", async () => {
    api.videos = [video(1, "Første", null)];
    api.count = 1;
    api.update.mockRejectedValueOnce(new Error("Episoden kunne ikke lagres."));

    render(<SeriesEpisodeOrder organizationId={9} seriesId={4} />);
    fireEvent.click(screen.getByRole("button", { name: "Lagre rekkefølge" }));

    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toBe("Episoden kunne ikke lagres."),
    );
  });

  it("reports videos added through the picker", () => {
    render(<SeriesEpisodeOrder organizationId={9} seriesId={4} />);

    fireEvent.click(screen.getByRole("button", { name: "Legg til i serien" }));

    expect(screen.getByRole("status").textContent).toBe("2 videoer ble lagt til i serien.");
  });
});
